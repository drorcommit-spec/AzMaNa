import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";
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
    .select("language")
    .eq("id", params.id)
    .maybeSingle<Pick<EventRow, "language">>();

  const { data } = await supabase
    .from("guest")
    .select("id, first_name, last_name, mobile, token, invite_sent_at")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <LinkList
      eventId={params.id}
      language={event?.language ?? "en"}
      baseUrl={baseUrl}
      guests={(data ?? []) as GuestLink[]}
    />
  );
}
