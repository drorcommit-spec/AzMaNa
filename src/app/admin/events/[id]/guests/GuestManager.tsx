"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div>
      <h1>Guests</h1>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>First</th>
            <th>Last</th>
            <th>Mobile</th>
            <th>Predicted</th>
            <th>Family</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.id}>
              <td>{g.first_name}</td>
              <td>{g.last_name}</td>
              <td>{g.mobile}</td>
              <td>{g.predicted_guests}</td>
              <td>{g.family_relation ?? ""}</td>
              <td>
                <button onClick={() => removeGuest(g.id)} disabled={busy}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {guests.length === 0 ? (
            <tr>
              <td colSpan={6}>No guests yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

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
          type="number"
          min={0}
          placeholder="Predicted guests"
          value={form.predictedGuests}
          onChange={(e) =>
            setForm({ ...form, predictedGuests: Number(e.target.value) })
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
