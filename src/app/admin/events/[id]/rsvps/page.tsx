import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestWithRsvp = {
  id: string;
  first_name: string;
  last_name: string;
  predicted_guests: number;
  rsvp: { attendee_count: number }[] | { attendee_count: number } | null;
};

function attendeeOf(g: GuestWithRsvp): number | null {
  if (!g.rsvp) return null;
  const r = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp;
  return r ? r.attendee_count : null;
}

/**
 * Shows each guest's confirmed Attendee_Count and the event total.
 * Requirements: 8.4
 */
export default async function RsvpsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("guest")
    .select("id, first_name, last_name, predicted_guests, rsvp(attendee_count)")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  const guests = (data ?? []) as GuestWithRsvp[];
  const total = guests.reduce((sum, g) => sum + (attendeeOf(g) ?? 0), 0);

  return (
    <div>
      <h1>RSVPs</h1>
      <p>
        Total confirmed attendees: <strong>{total}</strong>
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Predicted</th>
            <th>Confirmed</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => {
            const confirmed = attendeeOf(g);
            return (
              <tr key={g.id}>
                <td>
                  {g.first_name} {g.last_name}
                </td>
                <td>{g.predicted_guests}</td>
                <td>{confirmed === null ? "No response" : confirmed}</td>
              </tr>
            );
          })}
          {guests.length === 0 ? (
            <tr>
              <td colSpan={3}>No guests yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
