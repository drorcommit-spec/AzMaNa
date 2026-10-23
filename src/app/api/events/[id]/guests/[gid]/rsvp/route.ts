import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminRsvpSchema } from "@/lib/validation/schemas";

/**
 * POST /api/events/[id]/guests/[gid]/rsvp — organizer records (or clears) a
 * guest's RSVP on their behalf, for guests who confirmed outside the invite
 * link (e.g. by phone). Body: { attendeeCount: number | null }.
 * A number upserts the response; null removes it.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; gid: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminRsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Ensure the guest exists and belongs to this event (and isn't deleted).
  const { data: guest } = await supabase
    .from("guest")
    .select("id")
    .eq("id", params.gid)
    .eq("event_id", params.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!guest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.attendeeCount === null) {
    const { error } = await supabase
      .from("rsvp")
      .delete()
      .eq("guest_id", params.gid);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, attendeeCount: null });
  }

  const { error } = await supabase.from("rsvp").upsert(
    {
      guest_id: params.gid,
      attendee_count: parsed.data.attendeeCount,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "guest_id" },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attendeeCount: parsed.data.attendeeCount });
}
