import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";
import { formatEventDate } from "@/lib/invite/helpers";
import { GuestManager, type Guest } from "./GuestManager";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: event } = await supabase
    .from("event")
    .select("name, language, event_date, event_time, whatsapp_template")
    .eq("id", params.id)
    .maybeSingle<
      Pick<
        EventRow,
        "name" | "language" | "event_date" | "event_time" | "whatsapp_template"
      >
    >();

  const { data } = await supabase
    .from("guest")
    .select(
      "id, first_name, last_name, mobile, predicted_guests, family_relation, token, invite_sent_at, first_opened_at, rsvp(attendee_count)",
    )
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  const guests: Guest[] = (data ?? []).map((g: any) => {
    const r = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp;
    return {
      id: g.id,
      first_name: g.first_name,
      last_name: g.last_name,
      mobile: g.mobile,
      predicted_guests: g.predicted_guests,
      family_relation: g.family_relation,
      token: g.token,
      invite_sent_at: g.invite_sent_at,
      first_opened_at: g.first_opened_at,
      attendee_count: r ? r.attendee_count : null,
    };
  });

  const language = event?.language ?? "en";

  return (
    <GuestManager
      eventId={params.id}
      eventName={event?.name ?? ""}
      language={language}
      template={event?.whatsapp_template ?? null}
      eventDate={formatEventDate(
        event?.event_date ?? null,
        language === "he" ? "he-IL" : "en-GB",
      )}
      eventTime={event?.event_time ?? ""}
      baseUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
      guests={guests}
    />
  );
}
