"use client";

import { useState } from "react";
import { ATTENDEE_MAX, ATTENDEE_MIN } from "@/lib/validation/schemas";

export function RsvpForm({
  token,
  initialCount,
  labels,
}: {
  token: string;
  initialCount: number;
  labels: { attendeesLabel: string; submit: string; submitted: string };
}) {
  const [count, setCount] = useState(initialCount);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dec = () => setCount((c) => Math.max(ATTENDEE_MIN, c - 1));
  const inc = () => setCount((c) => Math.min(ATTENDEE_MAX, c + 1));

  async function submit() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeCount: count }),
      });
      if (!res.ok) {
        setError("Could not save your response. Please try again.");
        return;
      }
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <p>{labels.attendeesLabel}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={dec} disabled={count <= ATTENDEE_MIN} aria-label="decrease">
          −
        </button>
        <span style={{ fontSize: 24, minWidth: 32, textAlign: "center" }}>{count}</span>
        <button type="button" onClick={inc} disabled={count >= ATTENDEE_MAX} aria-label="increase">
          +
        </button>
      </div>
      {error ? <p role="alert" style={{ color: "crimson" }}>{error}</p> : null}
      {saved ? <p style={{ color: "green" }}>{labels.submitted}</p> : null}
      <button type="button" onClick={submit} disabled={busy} style={{ marginTop: 12 }}>
        {labels.submit}
      </button>
    </div>
  );
}
