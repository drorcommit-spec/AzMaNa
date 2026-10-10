import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";
import { ActiveToggle } from "./ActiveToggle";

export const dynamic = "force-dynamic";

/**
 * Event list for the authenticated admin. RLS limits rows to owned events.
 * Requirements: 8.1, 8.2, 8.3
 */
export default async function AdminHomePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("event")
    .select("id, name, address, language, is_active, created_at")
    .order("created_at", { ascending: false });

  const events = (data ?? []) as Pick<
    EventRow,
    "id" | "name" | "address" | "language" | "is_active" | "created_at"
  >[];

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Your events</h1>
        <Link href="/admin/events/new">+ New event</Link>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900, marginTop: 12 }}>
        <thead>
          <tr>
            <th style={th}>Event</th>
            <th style={th}>Address</th>
            <th style={th}>Language</th>
            <th style={th}>Status</th>
            <th style={{ ...th, textAlign: "right" }}>Manage</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td style={td}>
                <Link href={`/admin/events/${e.id}`}>
                  {e.name || "(untitled event)"}
                </Link>
              </td>
              <td style={td}>{e.address}</td>
              <td style={td}>{e.language === "he" ? "Hebrew" : "English"}</td>
              <td style={td}>
                <ActiveToggle eventId={e.id} initialActive={e.is_active} />
              </td>
              <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                <Link href={`/admin/events/${e.id}/guests`}>Guests</Link>
                {" · "}
                <Link href={`/admin/events/${e.id}/links`}>Invite links</Link>
                {" · "}
                <Link href={`/admin/events/${e.id}/rsvps`}>RSVPs</Link>
              </td>
            </tr>
          ))}
          {events.length === 0 ? (
            <tr>
              <td style={td} colSpan={5}>
                No events yet. Create your first one.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
