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

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>Your events</h1>
        <Link href="/admin/events/new" className="az-btn az-btn-gold">
          + New event
        </Link>
      </div>

      {events.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No events yet. Create your first one.</p>
      ) : null}

      {events.map((e) => (
        <div key={e.id} className="az-row">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Link
              href={`/admin/events/${e.id}`}
              style={{
                color: "var(--gold)",
                fontSize: 17,
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              {e.name || "(untitled event)"}
            </Link>
            <ActiveToggle eventId={e.id} initialActive={e.is_active} />
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 0" }}>
            📍 {e.address}
          </p>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "2px 0 0" }}>
            {e.language === "he" ? "Hebrew" : "English"}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link href={`/admin/events/${e.id}`} className="az-btn" style={{ flex: 1 }}>
              ✏️ Edit event
            </Link>
            <Link
              href={`/admin/events/${e.id}/guests`}
              className="az-btn"
              style={{ flex: 1 }}
            >
              👥 Guests
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
