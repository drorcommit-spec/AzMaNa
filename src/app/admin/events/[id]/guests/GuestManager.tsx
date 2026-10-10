"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { csvToGuests, guestsToCsv } from "@/lib/guests/csv";

export type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  predicted_guests: number;
  family_relation: string | null;
};

const EMPTY = {
  firstName: "",
  lastName: "",
  mobile: "",
  predictedGuests: 0,
  familyRelation: "",
};

type EditForm = {
  firstName: string;
  lastName: string;
  mobile: string;
  predictedGuests: number;
  familyRelation: string;
};

export function GuestManager({
  eventId,
  guests,
}: {
  eventId: string;
  guests: Guest[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Inline edit state: which row is being edited, and its draft values.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY);
  const [editError, setEditError] = useState<string | null>(null);

  // Import/export state.
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function exportCsv() {
    const csv = guestsToCsv(guests);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
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
      const text = await file.text();
      const { rows, skipped: parseSkipped } = csvToGuests(text);
      if (rows.length === 0) {
        setImportMsg(`No valid rows found in the file.`);
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
      const skippedTotal = (data.skipped ?? 0) + parseSkipped;
      setImportMsg(
        `Imported ${data.added} guest(s). Skipped ${skippedTotal} (duplicates or invalid).`,
      );
      router.refresh();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
    padding: "8px 12px",
    borderBottom: "2px solid #ddd",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "1px solid #eee",
    verticalAlign: "middle",
  };
  const cellInput: React.CSSProperties = {
    width: "100%",
    padding: "4px 6px",
    boxSizing: "border-box",
  };

  return (
    <div>
      <h1>Guests</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button type="button" onClick={exportCsv} disabled={guests.length === 0}>
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
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
        <span style={{ fontSize: 13, color: "#777" }}>
          Columns: first_name, last_name, mobile, predicted_guests, family_relation
        </span>
      </div>
      {importMsg ? (
        <p style={{ color: "#2e8b57" }}>{importMsg}</p>
      ) : null}

      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 980 }}>
        <thead>
          <tr>
            <th style={th}>First</th>
            <th style={th}>Last</th>
            <th style={th}>Mobile</th>
            <th style={th}>Predicted</th>
            <th style={th}>Family</th>
            <th style={{ ...th, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => {
            const editing = editingId === g.id;
            return (
              <tr key={g.id}>
                {editing ? (
                  <>
                    <td style={td}>
                      <input
                        style={cellInput}
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, firstName: e.target.value })
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={cellInput}
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={cellInput}
                        value={editForm.mobile}
                        onChange={(e) =>
                          setEditForm({ ...editForm, mobile: e.target.value })
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={cellInput}
                        type="text"
                        inputMode="numeric"
                        value={editForm.predictedGuests}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            predictedGuests: Number(
                              e.target.value.replace(/\D/g, ""),
                            ),
                          })
                        }
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={cellInput}
                        value={editForm.familyRelation}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            familyRelation: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => saveEdit(g.id)} disabled={busy}>
                        Save
                      </button>{" "}
                      <button onClick={cancelEdit} disabled={busy}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={td}>{g.first_name}</td>
                    <td style={td}>{g.last_name}</td>
                    <td style={td}>{g.mobile}</td>
                    <td style={td}>{g.predicted_guests}</td>
                    <td style={td}>{g.family_relation ?? ""}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => startEdit(g)} disabled={busy}>
                        Edit
                      </button>{" "}
                      <button onClick={() => removeGuest(g.id)} disabled={busy}>
                        Remove
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {guests.length === 0 ? (
            <tr>
              <td style={td} colSpan={6}>
                No guests yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {editError ? (
        <p role="alert" style={{ color: "crimson" }}>
          {editError}
        </p>
      ) : null}

      <h2>Add guest</h2>
      <form onSubmit={addGuest} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
        />
        <input
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
        />
        <input
          placeholder="Mobile number"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          required
        />
        <input
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
          placeholder="Family relation (optional)"
          value={form.familyRelation}
          onChange={(e) => setForm({ ...form, familyRelation: e.target.value })}
        />
        {error ? (
          <p role="alert" style={{ color: "crimson" }}>
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy}>
          Add guest
        </button>
      </form>
    </div>
  );
}
