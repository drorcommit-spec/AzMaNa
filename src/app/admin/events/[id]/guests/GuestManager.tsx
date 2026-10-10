"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { csvToGuests, decodeCsvFile, guestsToCsv } from "@/lib/guests/csv";
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY);
  const [editError, setEditError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // WhatsApp send queue + instant "sent" overlay.
  const [sentNow, setSentNow] = useState<Record<string, boolean>>({});
  const queueRef = useRef<Guest[]>([]);
  const [queueActive, setQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const linkFor = (token: string) => `${baseUrl}/invite/${token}`;
  const isSent = (g: Guest) => Boolean(g.invite_sent_at) || sentNow[g.id];

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
  const predictedTotal = guests.reduce((s, g) => s + (g.predicted_guests ?? 0), 0);
  const confirmedTotal = guests.reduce((s, g) => s + (g.attendee_count ?? 0), 0);
  const respondedCount = guests.filter((g) => g.attendee_count !== null).length;

  // ---- CSV ----
  function exportCsv() {
    const csv = guestsToCsv(guests);
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
      const stamp = formatStamp(g.invite_sent_at);
      return <span style={{ color: "#888" }}>Sent{stamp ? ` ${stamp}` : ""}</span>;
    }
    return <span style={{ color: "#bbb" }}>Not sent</span>;
  }

  return (
    <div>
      <h1>Guests</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <button onClick={startQueue} disabled={pendingCount === 0 || queueActive} style={{ ...waBtn, padding: "10px 16px" }}>
          Send to all ({pendingCount})
        </button>
        <button type="button" onClick={exportCsv} disabled={guests.length === 0}>
          Export CSV
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
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

      <p style={{ fontWeight: 600 }}>
        Guests: {guests.length} &nbsp;|&nbsp; Predicted: {predictedTotal} &nbsp;|&nbsp;
        Responded: {respondedCount} &nbsp;|&nbsp; Confirmed attendees: {confirmedTotal}
      </p>

      {queueActive ? (
        <div style={{ border: "1px solid #cde", background: "#f2f8ff", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px" }}>
            Sending {queueIndex + 1} of {queueRef.current.length}:{" "}
            <strong>
              {queueRef.current[queueIndex]?.first_name} {queueRef.current[queueIndex]?.last_name}
            </strong>
            . After you tap send in WhatsApp, come back and continue.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={sendNextInQueue} style={waBtn}>
              {queueIndex + 1 >= queueRef.current.length ? "Finish" : "Next guest"}
            </button>
            <button onClick={() => openWhatsapp(queueRef.current[queueIndex])}>Reopen this one</button>
            <button onClick={stopQueue}>Stop</button>
          </div>
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 32 }}>#</th>
              <th style={th}>Guest</th>
              <th style={th}>Predicted</th>
              <th style={th}>Family</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map((g, i) => {
              const editing = editingId === g.id;
              if (editing) {
                return (
                  <tr key={g.id}>
                    <td style={{ ...td, color: "#999" }}>{i + 1}</td>
                    <td style={td}>
                      <input style={cellInput} value={editForm.firstName} placeholder="First"
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                      <input style={{ ...cellInput, marginTop: 4 }} value={editForm.lastName} placeholder="Last"
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                      <input style={{ ...cellInput, marginTop: 4 }} value={editForm.mobile} placeholder="Mobile"
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
                    </td>
                    <td style={td}>
                      <input style={cellInput} type="text" inputMode="numeric" value={editForm.predictedGuests}
                        onChange={(e) => setEditForm({ ...editForm, predictedGuests: Number(e.target.value.replace(/\D/g, "")) })} />
                    </td>
                    <td style={td}>
                      <input style={cellInput} value={editForm.familyRelation}
                        onChange={(e) => setEditForm({ ...editForm, familyRelation: e.target.value })} />
                    </td>
                    <td style={td}>{statusLabel(g)}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => saveEdit(g.id)} disabled={busy}>Save</button>{" "}
                      <button onClick={cancelEdit} disabled={busy}>Cancel</button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={g.id}>
                  <td style={{ ...td, color: "#999" }}>{i + 1}</td>
                  <td style={td}>
                    {g.first_name} {g.last_name}
                    <div style={{ color: "#888", fontSize: 13 }}>{g.mobile}</div>
                  </td>
                  <td style={td}>{g.predicted_guests}</td>
                  <td style={td}>{g.family_relation ?? ""}</td>
                  <td style={td}>{statusLabel(g)}</td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => openWhatsapp(g)} style={waBtn}>WhatsApp</button>{" "}
                    <button onClick={() => startEdit(g)} disabled={busy}>Edit</button>{" "}
                    <button onClick={() => removeGuest(g.id)} disabled={busy}>Remove</button>
                  </td>
                </tr>
              );
            })}
            {guests.length === 0 ? (
              <tr>
                <td style={td} colSpan={6}>No guests yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editError ? <p role="alert" style={{ color: "crimson" }}>{editError}</p> : null}

      <h2>Add guest</h2>
      <form onSubmit={addGuest} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input placeholder="First name" value={form.firstName} required
          onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Last name" value={form.lastName} required
          onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input placeholder="Mobile number" value={form.mobile} required
          onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <input type="text" inputMode="numeric" placeholder="Predicted guests" value={form.predictedGuests}
          onChange={(e) => setForm({ ...form, predictedGuests: Number(e.target.value.replace(/\D/g, "")) })} />
        <input placeholder="Family relation (optional)" value={form.familyRelation}
          onChange={(e) => setForm({ ...form, familyRelation: e.target.value })} />
        {error ? <p role="alert" style={{ color: "crimson" }}>{error}</p> : null}
        <button type="submit" disabled={busy}>Add guest</button>
      </form>
    </div>
  );
}
