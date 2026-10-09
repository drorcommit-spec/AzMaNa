import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";
import { EventForm } from "../EventForm";

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("event")
    .select("id, language, image_url, address, greeting, event_date, event_time")
    .eq("id", params.id)
    .maybeSingle<
      Pick<
        EventRow,
        "id" | "language" | "image_url" | "address" | "greeting" | "event_date" | "event_time"
      >
    >();

  if (!data) {
    notFound();
  }

  return (
    <div>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link href={`/admin/events/${params.id}/guests`}>Guests</Link>
        <Link href={`/admin/events/${params.id}/links`}>Invite links</Link>
        <Link href={`/admin/events/${params.id}/rsvps`}>RSVPs</Link>
      </nav>
      <EventForm
        initial={{
          id: data.id,
          language: data.language,
          imageUrl: data.image_url,
          address: data.address,
          greeting: data.greeting,
          eventDate: data.event_date ?? "",
          eventTime: data.event_time ?? "",
        }}
      />
    </div>
  );
}
