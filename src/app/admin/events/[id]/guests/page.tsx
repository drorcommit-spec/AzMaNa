import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GuestManager, type Guest } from "./GuestManager";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("guest")
    .select("id, first_name, last_name, mobile, predicted_guests, family_relation")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true });

  return <GuestManager eventId={params.id} guests={(data ?? []) as Guest[]} />;
}
