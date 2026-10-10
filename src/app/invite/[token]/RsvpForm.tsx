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
  labels: {
    attendeesLabel: string;
    submit: string;
    decline: string;
    declined: string;
    submitted: string;
  };
}) {
  const [count, setCount] = useState(initialCount);
  const [saved, setSaved] = useState<null | "attending" | "declined">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dec = () => setCount((c) => Math.max(ATTENDEE_MIN, c - 1));
  const inc = () => setCount((c) => Math.min(ATTENDEE_MAX, c + 1));

  async function submit(value: number, kind: "attending" | "declined") {
    setBusy(true);
    setSaved(null);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeCount: value }),
      });
      if (!res.ok) {
        setError("Could not save your response. Please try again.");
        return;
      }
      if (kind === "declined") setCount(0);
      setSaved(kind);
    } finally {
      setBusy(false);
    }
  }

  const circleButton = (bg: string): React.CSSProperties => ({
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background: bg,
    color: "#fff",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
  });

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>
        {labels.attendeesLabel}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={dec}
          disabled={count <= ATTENDEE_MIN}
          aria-label="decrease"
          style={{
            ...circleButton("#e2554f"),
            opacity: count <= ATTENDEE_MIN ? 0.4 : 1,
          }}
        >
          −
        </button>

        <span
          style={{
            minWidth: 72,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
            border: "2px solid #e5c87a",
            borderRadius: 14,
          }}
        >
          {count}
        </span>

        <button
          type="button"
          onClick={inc}
          disabled={count >= ATTENDEE_MAX}
          aria-label="increase"
          style={{
            ...circleButton("#2b6fd6"),
            opacity: count >= ATTENDEE_MAX ? 0.4 : 1,
          }}
        >
          +
        </button>
      </div>

      {error ? (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      ) : null}
      {saved === "attending" ? (
        <p style={{ color: "#2e8b57", fontWeight: 600 }}>{labels.submitted}</p>
      ) : null}
      {saved === "declined" ? (
        <p style={{ color: "#2e8b57", fontWeight: 600 }}>{labels.declined}</p>
      ) : null}

      <button
        type="button"
        onClick={() => submit(count, "attending")}
        disabled={busy}
        style={{
          width: "100%",
          padding: "14px 16px",
          border: "none",
          borderRadius: 12,
          background: "linear-gradient(90deg, #d4a62a, #e9c558)",
          color: "#fff",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(212,166,42,0.35)",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {labels.submit} ✨
      </button>

      <button
        type="button"
        onClick={() => submit(0, "declined")}
        disabled={busy}
        style={{
          width: "100%",
          marginTop: 10,
          padding: "10px 16px",
          border: "1px solid #ddd",
          borderRadius: 12,
          background: "#fff",
          color: "#777",
          fontSize: 15,
          cursor: "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {labels.decline}
      </button>
    </div>
  );
}
