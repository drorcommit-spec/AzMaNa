"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildInviteMessage,
  buildWhatsappLink,
} from "@/lib/invite/helpers";

export type GuestLink = {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  token: string;
  invite_sent_at: string | null;
};

export function LinkList({
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
  guests: GuestLink[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  // Local sent overlay so the UI updates instantly without a full refetch.
  const [sentNow, setSentNow] = useState<Record<string, boolean>>({});
  const queueRef = useRef<GuestLink[]>([]);
  const [queueActive, setQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const linkFor = (token: string) => `${baseUrl}/invite/${token}`;
  const isSent = (g: GuestLink) => Boolean(g.invite_sent_at) || sentNow[g.id];

  // Formats the stored ISO timestamp as a local dd/mm/yyyy HH:MM string.
  const formatSentAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Sent";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const anySelected = useMemo(
    () => guests.some((g) => selected[g.id]),
    [guests, selected],
  );
  const allSelected = guests.length > 0 && guests.every((g) => selected[g.id]);

  const selectedLinks = useMemo(
    () =>
      guests
        .filter((g) => selected[g.id])
        .map((g) => `${g.first_name} ${g.last_name}: ${linkFor(g.token)}`)
        .join("\n"),
    [guests, selected], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAll() {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      guests.forEach((g) => (next[g.id] = true));
      setSelected(next);
    }
  }

  async function markSent(gid: string) {
    setSentNow((prev) => ({ ...prev, [gid]: true }));
    await fetch(`/api/events/${eventId}/guests/${gid}/sent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sent: true }),
    }).catch(() => {});
  }

  function openWhatsapp(g: GuestLink) {
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
    const url = buildWhatsappLink(g.mobile, msg);
    window.open(url, "_blank", "noopener,noreferrer");
    void markSent(g.id);
  }

  async function copySelected() {
    await navigator.clipboard.writeText(selectedLinks);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // "Send to all": queue the selected guests (or everyone if none selected)
  // who have not been sent yet, opening each WhatsApp chat one at a time.
  function startQueue() {
    const pool = anySelected ? guests.filter((g) => selected[g.id]) : guests;
    const pending = pool.filter((g) => !isSent(g));
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
  const waBtn: React.CSSProperties = {
    background: "#25D366",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: 600,
  };

  const totalPending = (anySelected
    ? guests.filter((g) => selected[g.id])
    : guests
  ).filter((g) => !isSent(g)).length;

  return (
    <div>
      <h1>Invite links</h1>
      <p>
        Send each guest a personalized WhatsApp invitation. WhatsApp opens with
        the message pre-filled; tap send, then continue to the next guest.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
        <button
          onClick={startQueue}
          disabled={totalPending === 0 || queueActive}
          style={{ ...waBtn, padding: "10px 16px" }}
        >
          Send to all {anySelected ? "selected" : ""} ({totalPending})
        </button>
        <button onClick={copySelected} disabled={!selectedLinks}>
          {copied ? "Copied!" : "Copy selected links"}
        </button>
      </div>

      {queueActive ? (
        <div
          style={{
            border: "1px solid #cde",
            background: "#f2f8ff",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p style={{ margin: "0 0 8px" }}>
            Sending {queueIndex + 1} of {queueRef.current.length}:{" "}
            <strong>
              {queueRef.current[queueIndex]?.first_name}{" "}
              {queueRef.current[queueIndex]?.last_name}
            </strong>
            . After you tap send in WhatsApp, come back and continue.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={sendNextInQueue} style={waBtn}>
              {queueIndex + 1 >= queueRef.current.length
                ? "Finish"
                : "Next guest"}
            </button>
            <button
              onClick={() => openWhatsapp(queueRef.current[queueIndex])}
            >
              Reopen this one
            </button>
            <button onClick={stopQueue}>Stop</button>
          </div>
        </div>
      ) : null}

      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 32 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="select all"
              />
            </th>
            <th style={th}>Guest</th>
            <th style={th}>Last sent</th>
            <th style={{ ...th, textAlign: "right" }}>Send</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.id}>
              <td style={td}>
                <input
                  type="checkbox"
                  checked={Boolean(selected[g.id])}
                  onChange={() => toggle(g.id)}
                />
              </td>
              <td style={td}>
                {g.first_name} {g.last_name}
                <div style={{ color: "#888", fontSize: 13 }}>{g.mobile}</div>
              </td>
              <td style={td}>
                {g.invite_sent_at ? (
                  <span style={{ color: "#2e8b57", fontWeight: 600 }}>
                    {formatSentAt(g.invite_sent_at)}
                  </span>
                ) : sentNow[g.id] ? (
                  <span style={{ color: "#2e8b57", fontWeight: 600 }}>
                    Just now
                  </span>
                ) : (
                  <span style={{ color: "#999" }}>Not sent</span>
                )}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <button onClick={() => openWhatsapp(g)} style={waBtn}>
                  WhatsApp
                </button>
              </td>
            </tr>
          ))}
          {guests.length === 0 ? (
            <tr>
              <td style={td} colSpan={4}>
                No guests yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
