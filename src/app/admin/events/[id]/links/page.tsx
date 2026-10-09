import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LinkList, type GuestLink } from "./LinkList";

export default async function LinksPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("guest")
    .select("id, first_name, last_name, token")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return <LinkList baseUrl={baseUrl} guests={(data ?? []) as GuestLink[]} />;
}
