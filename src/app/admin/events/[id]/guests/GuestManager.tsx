"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  csvToGuests,
  decodeCsvFile,
  guestsToExportCsv,
} from "@/lib/guests/csv";
import { buildInviteMessage, buildWhatsappLink } from "@/lib/invite/helpers";

export type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  predicted_guests: number;
  family_relation: string | null;
  token: string;
  invite_sent_at: string | null;
  first_opened_at: string | null;
  attendee_count: number | null;
};

const EMPTY = {
  firstName: "",
  lastName: "",
  mobile: "",
  predictedGuests: 0,
  familyRelation: "",
};

type EditForm = typeof EMPTY;

export function GuestManager({
  eventId,
  eventName,
  language,
  template,
  eventDate,
  eventTime,
  baseUrl,
  guests,
}: {
  eventId: string;
  eventName: string;
  language: "he" | "en";
  template: string | null;
  eventDate: string;
  eventTime: string;
  baseUrl: string;
  guests: Guest[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "not_sent" | "sent" | "opened" | "responded"
  >("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY);
  const [editError, setEditError] = useState<string | null>(null);

  // Manual RSVP (organizer sets a response for a guest who confirmed off-link).
  const [rsvpEditingId, setRsvpEditingId] = useState<string | null>(null);
  const [rsvpValue, setRsvpValue] = useState(1);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // WhatsApp send queue + instant "sent" overlay.
  const [sentNow, setSentNow] = useState<Record<string, boolean>>({});
  const queueRef = useRef<Guest[]>([]);
  const [queueActive, setQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const linkFor = (token: string) => `${baseUrl}/invite/${token}`;
  const isSent = (g: Guest) => Boolean(g.invite_sent_at) || sentNow[g.id];
  const statusOf = (g: Guest): "not_sent" | "sent" | "opened" | "responded" => {
    if (g.attendee_count !== null) return "responded";
    if (g.first_opened_at) return "opened";
    if (isSent(g)) return "sent";
    return "not_sent";
  };

  const formatStamp = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const sortedGuests = useMemo(
    () =>
      [...guests].sort((a, b) =>
        a.first_name.localeCompare(b.first_name, undefined, {
          sensitivity: "base",
        }),
      ),
    [guests],
  );
  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedGuests.filter((g) => {
      const matchesName =
        !q || `${g.first_name} ${g.last_name}`.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || statusOf(g) === statusFilter;
      return matchesName && matchesStatus;
    });
    // statusOf depends on sentNow so recompute when optimistic sends change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedGuests, search, statusFilter, sentNow]);

  const predictedTotal = guests.reduce((s, g) => s + (g.predicted_guests ?? 0), 0);
  const confirmedTotal = guests.reduce((s, g) => s + (g.attendee_count ?? 0), 0);
  const respondedCount = guests.filter((g) => g.attendee_count !== null).length;

  // ---- CSV ----
  function exportCsv() {
    const csv = guestsToExportCsv(guests);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    setImportMsg(null);
    setBusy(true);
    try {
      const text = await decodeCsvFile(file);
      const { rows, skipped: parseSkipped } = csvToGuests(text);
      if (rows.length === 0) {
        setImportMsg("No valid rows found in the file.");
        return;
      }
      const res = await fetch(`/api/events/${eventId}/guests/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: rows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportMsg(data.error ?? "Import failed.");
        return;
      }
      setImportMsg(
        `Imported ${data.added} guest(s). Skipped ${(data.skipped ?? 0) + parseSkipped} (duplicates or invalid).`,
      );
      router.refresh();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ---- WhatsApp ----
  async function markSent(gid: string) {
    setSentNow((prev) => ({ ...prev, [gid]: true }));
    await fetch(`/api/events/${eventId}/guests/${gid}/sent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sent: true }),
    }).catch(() => {});
  }

  function openWhatsapp(g: Guest) {
    const msg = buildInviteMessage(
      language,
      linkFor(g.token),
      {
        firstName: g.first_name,
        lastName: g.last_name,
        eventName,
        date: eventDate,
        time: eventTime,
      },
      template,
    );
    window.open(buildWhatsappLink(g.mobile, msg), "_blank", "noopener,noreferrer");
    void markSent(g.id);
  }

  function startQueue() {
    const pending = sortedGuests.filter((g) => !isSent(g));
    if (pending.length === 0) return;
    queueRef.current = pending;
    setQueueIndex(0);
    setQueueActive(true);
    openWhatsapp(pending[0]);
  }
  function sendNextInQueue() {
    const next = queueIndex + 1;
    if (next >= queueRef.current.length) {
      setQueueActive(false);
      router.refresh();
      return;
    }
    setQueueIndex(next);
    openWhatsapp(queueRef.current[next]);
  }
  function stopQueue() {
    setQueueActive(false);
    router.refresh();
  }

  // ---- CRUD ----
  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          mobile: form.mobile,
          predictedGuests: Number(form.predictedGuests),
          familyRelation: form.familyRelation || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not add guest.");
        return;
      }
      setForm(EMPTY);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(g: Guest) {
    setEditingId(g.id);
    setEditError(null);
    setEditForm({
      firstName: g.first_name,
      lastName: g.last_name,
      mobile: g.mobile,
      predictedGuests: g.predicted_guests,
      familyRelation: g.family_relation ?? "",
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }
  async function saveEdit(gid: string) {
    setBusy(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/guests/${gid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          mobile: editForm.mobile,
          predictedGuests: Number(editForm.predictedGuests),
          familyRelation: editForm.familyRelation || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditError(data.error ?? "Could not save guest.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  async function removeGuest(gid: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/guests/${gid}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not remove guest.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // ---- Manual RSVP ----
  function startRsvp(g: Guest) {
    setRsvpEditingId(g.id);
    setRsvpError(null);
    setRsvpValue(g.attendee_count ?? 1);
  }
  function cancelRsvp() {
    setRsvpEditingId(null);
    setRsvpError(null);
  }
  async function saveRsvp(gid: string, attendeeCount: number | null) {
    setBusy(true);
    setRsvpError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/guests/${gid}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeCount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRsvpError(data.error ?? "Could not save RSVP.");
        return;
      }
      setRsvpEditingId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "2px solid #ddd",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #eee",
    verticalAlign: "middle",
  };
  const cellInput: React.CSSProperties = {
    width: "100%",
    padding: "4px 6px",
    boxSizing: "border-box",
  };
  const waBtn: React.CSSProperties = {
    background: "#25D366",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const pendingCount = sortedGuests.filter((g) => !isSent(g)).length;

  function statusLabel(g: Guest) {
    if (g.attendee_count !== null) {
      return (
        <span style={{ color: "#2e8b57", fontWeight: 600 }}>
          Responded ({g.attendee_count})
        </span>
      );
    }
    if (g.first_opened_at) {
      return <span style={{ color: "#2b6fd6" }}>Opened</span>;
    }
    if (isSent(g)) {
      return <span style={{ color: "#888" }}>Sent</span>;
    }
    return <span style={{ color: "#bbb" }}>Not sent</span>;
  }

  function statusBadge(g: Guest) {
    if (g.attendee_count !== null) {
      return (
        <span className="az-badge az-badge-active">
          Responded ({g.attendee_count})
        </span>
      );
    }
    if (g.first_opened_at) {
      return <span className="az-badge az-badge-info">Opened</span>;
    }
    if (isSent(g)) {
      return <span className="az-badge az-badge-inactive">Sent</span>;
    }
    return <span className="az-badge az-badge-muted">Not sent</span>;
  }

  const cellInputF: React.CSSProperties = {
    ...cellInput,
    padding: "10px",
    fontSize: 16,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    marginBottom: 6,
  };

  return (
    <div>
      <h1>Guests</h1>

      <div className="az-stats">
        <span className="az-stat">
          Guests <b>{guests.length}</b>
        </span>
        <span className="az-stat">
          Predicted <b>{predictedTotal}</b>
        </span>
        <span className="az-stat">
          Responded <b>{respondedCount}</b>
        </span>
        <span className="az-stat">
          Confirmed <b>{confirmedTotal}</b>
        </span>
      </div>

      <button
        onClick={startQueue}
        disabled={pendingCount === 0 || queueActive}
        className="az-btn az-btn-wa az-btn-block"
        style={{ marginBottom: 10 }}
      >
        💬 Send to all guests ({pendingCount})
      </button>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          type="button"
          onClick={exportCsv}
          disabled={guests.length === 0}
          className="az-btn"
          style={{ flex: 1 }}
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="az-btn"
          style={{ flex: 1 }}
        >
          Import CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importCsv(f);
          }}
        />
      </div>
      {importMsg ? <p style={{ color: "#2e8b57" }}>{importMsg}</p> : null}

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          className="az-input"
          type="search"
          placeholder="Search by first or last name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          className="az-input"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          aria-label="Filter by message status"
          style={{ flex: "0 0 160px" }}
        >
          <option value="all">All statuses</option>
          <option value="not_sent">Not sent</option>
          <option value="sent">Sent</option>
          <option value="opened">Opened</option>
          <option value="responded">Responded</option>
        </select>
      </div>

      {queueActive ? (
        <div
          style={{
            border: "1px solid #cde",
            background: "#f2f8ff",
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <p style={{ margin: "0 0 10px" }}>
            Sending {queueIndex + 1} of {queueRef.current.length}:{" "}
            <strong>
              {queueRef.current[queueIndex]?.first_name}{" "}
              {queueRef.current[queueIndex]?.last_name}
            </strong>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={sendNextInQueue} className="az-btn az-btn-wa">
              {queueIndex + 1 >= queueRef.current.length ? "Finish" : "Next guest"}
            </button>
            <button
              onClick={() => openWhatsapp(queueRef.current[queueIndex])}
              className="az-btn"
            >
              Reopen
            </button>
            <button onClick={stopQueue} className="az-btn">
              Stop
            </button>
          </div>
        </div>
      ) : null}

      {/* Guest cards */}
      {filteredGuests.map((g, i) => {
        const editing = editingId === g.id;
        if (editing) {
          return (
            <div key={g.id} className="az-row">
              <input
                style={cellInputF}
                value={editForm.firstName}
                placeholder="First name"
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
              />
              <input
                style={cellInputF}
                value={editForm.lastName}
                placeholder="Last name"
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
              />
              <input
                style={cellInputF}
                value={editForm.mobile}
                placeholder="Mobile"
                onChange={(e) =>
                  setEditForm({ ...editForm, mobile: e.target.value })
                }
              />
              <input
                style={cellInputF}
                type="text"
                inputMode="numeric"
                placeholder="Predicted"
                value={editForm.predictedGuests}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    predictedGuests: Number(e.target.value.replace(/\D/g, "")),
                  })
                }
              />
              <input
                style={cellInputF}
                value={editForm.familyRelation}
                placeholder="Family relation"
                onChange={(e) =>
                  setEditForm({ ...editForm, familyRelation: e.target.value })
                }
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => saveEdit(g.id)}
                  disabled={busy}
                  className="az-btn az-btn-gold"
                  style={{ flex: 1 }}
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={busy}
                  className="az-btn"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }
        return (
          <div key={g.id} className="az-row">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  <span style={{ color: "#bbb", marginInlineEnd: 6 }}>{i + 1}.</span>
                  {g.first_name} {g.last_name}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                  {g.mobile} • {g.predicted_guests} predicted
                  {g.family_relation ? ` • ${g.family_relation}` : ""}
                </div>
                {isSent(g) || sentNow[g.id] ? (
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                    Sent: {sentNow[g.id] ? "Just now" : formatStamp(g.invite_sent_at)}
                  </div>
                ) : null}
              </div>
              {statusBadge(g)}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => openWhatsapp(g)}
                className="az-btn az-btn-wa"
                style={{ flex: 1 }}
              >
                WhatsApp
              </button>
              <button onClick={() => startEdit(g)} disabled={busy} className="az-btn">
                Edit
              </button>
              <button
                onClick={() => removeGuest(g.id)}
                disabled={busy}
                className="az-btn"
              >
                Remove
              </button>
            </div>

            {rsvpEditingId === g.id ? (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  Attendees:
                </span>
                <input
                  className="az-input"
                  type="text"
                  inputMode="numeric"
                  value={rsvpValue}
                  onChange={(e) =>
                    setRsvpValue(Number(e.target.value.replace(/\D/g, "")) || 0)
                  }
                  style={{ width: 70 }}
                />
                <button
                  onClick={() => saveRsvp(g.id, rsvpValue)}
                  disabled={busy}
                  className="az-btn az-btn-gold"
                >
                  Save RSVP
                </button>
                {g.attendee_count !== null ? (
                  <button
                    onClick={() => saveRsvp(g.id, null)}
                    disabled={busy}
                    className="az-btn"
                  >
                    Clear
                  </button>
                ) : null}
                <button onClick={cancelRsvp} disabled={busy} className="az-btn">
                  Cancel
                </button>
                {rsvpError ? (
                  <span role="alert" style={{ color: "crimson", fontSize: 13 }}>
                    {rsvpError}
                  </span>
                ) : null}
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => startRsvp(g)}
                  disabled={busy}
                  className="az-btn"
                  style={{ fontSize: 13 }}
                >
                  {g.attendee_count !== null
                    ? "Edit RSVP manually"
                    : "Set RSVP manually"}
                </button>
              </div>
            )}
          </div>
        );
      })}
      {guests.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No guests yet.</p>
      ) : filteredGuests.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No guests match the current filters.</p>
      ) : null}

      {editError ? (
        <p role="alert" style={{ color: "crimson" }}>
          {editError}
        </p>
      ) : null}

      <h2>Add guest</h2>
      <form onSubmit={addGuest} className="az-card" style={{ display: "grid", gap: 10 }}>
        <input
          className="az-input"
          placeholder="First name"
          value={form.firstName}
          required
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <input
          className="az-input"
          placeholder="Last name"
          value={form.lastName}
          required
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <input
          className="az-input"
          placeholder="Mobile number"
          value={form.mobile}
          required
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
        />
        <input
          className="az-input"
          type="text"
          inputMode="numeric"
          placeholder="Predicted guests"
          value={form.predictedGuests}
          onChange={(e) =>
            setForm({
              ...form,
              predictedGuests: Number(e.target.value.replace(/\D/g, "")),
            })
          }
        />
        <input
          className="az-input"
          placeholder="Family relation (optional)"
          value={form.familyRelation}
          onChange={(e) => setForm({ ...form, familyRelation: e.target.value })}
        />
        {error ? (
          <p role="alert" style={{ color: "crimson", margin: 0 }}>
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className="az-btn az-btn-gold">
          Add guest
        </button>
      </form>
    </div>
  );
}
