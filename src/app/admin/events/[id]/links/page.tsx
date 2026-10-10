import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";
import { formatEventDate } from "@/lib/invite/helpers";
import { LinkList, type GuestLink } from "./LinkList";

export const dynamic = "force-dynamic";

export default async function LinksPage({
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
    .select("id, first_name, last_name, mobile, token, invite_sent_at")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const language = event?.language ?? "en";

  return (
    <LinkList
      eventId={params.id}
      eventName={event?.name ?? ""}
      language={language}
      template={event?.whatsapp_template ?? null}
      eventDate={formatEventDate(event?.event_date ?? null, language === "he" ? "he-IL" : "en-GB")}
      eventTime={event?.event_time ?? ""}
      baseUrl={baseUrl}
      guests={(data ?? []) as GuestLink[]}
    />
  );
}
