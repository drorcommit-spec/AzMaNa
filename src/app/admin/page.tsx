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
    .select("id, address, language, is_active, created_at")
    .order("created_at", { ascending: false });

  const events = (data ?? []) as Pick<
    EventRow,
    "id" | "address" | "language" | "is_active" | "created_at"
  >[];

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

      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 12 }}>
        <thead>
          <tr>
            <th>Address</th>
            <th>Language</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td>
                <Link href={`/admin/events/${e.id}`}>{e.address}</Link>
              </td>
              <td>{e.language === "he" ? "Hebrew" : "English"}</td>
              <td>
                <ActiveToggle eventId={e.id} initialActive={e.is_active} />
              </td>
              <td>
                <Link href={`/admin/events/${e.id}/rsvps`}>RSVPs</Link>
              </td>
            </tr>
          ))}
          {events.length === 0 ? (
            <tr>
              <td colSpan={4}>No events yet. Create your first one.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
