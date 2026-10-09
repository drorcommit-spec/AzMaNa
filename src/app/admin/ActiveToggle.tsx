"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActiveToggle({
  eventId,
  initialActive,
}: {
  eventId: string;
  initialActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !active;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (res.ok) {
        setActive(next);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={toggle} disabled={busy}>
      {active ? "Active" : "Inactive"}
    </button>
  );
}
