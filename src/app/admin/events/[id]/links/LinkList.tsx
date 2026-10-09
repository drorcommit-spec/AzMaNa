"use client";

import { useMemo, useState } from "react";

export type GuestLink = {
  id: string;
  first_name: string;
  last_name: string;
  token: string;
};

export function LinkList({
  baseUrl,
  guests,
}: {
  baseUrl: string;
  guests: GuestLink[];
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const linkFor = (token: string) => `${baseUrl}/invite/${token}`;

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

  async function copySelected() {
    await navigator.clipboard.writeText(selectedLinks);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  return (
    <div>
      <h1>Invite links</h1>
      <p>Select guests and copy their links to paste into WhatsApp.</p>

      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 32 }}></th>
            <th style={th}>Guest</th>
            <th style={th}>Invite link</th>
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
              </td>
              <td style={td}>
                <code>{linkFor(g.token)}</code>
              </td>
            </tr>
          ))}
          {guests.length === 0 ? (
            <tr>
              <td style={td} colSpan={3}>
                No guests yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <button
        onClick={copySelected}
        disabled={!selectedLinks}
        style={{ marginTop: 12 }}
      >
        {copied ? "Copied!" : "Copy selected links"}
      </button>
    </div>
  );
}
