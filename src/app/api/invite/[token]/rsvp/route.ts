import { NextResponse } from "next/server";
import { getInviteView } from "@/lib/invite/getInviteView";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { rsvpSchema } from "@/lib/validation/schemas";

/**
 * POST /api/invite/[token]/rsvp — record a guest's attendee count.
 * Re-validates the token and active state, then upserts the RSVP so a
 * resubmission replaces the previous value.
 * Requirements: 7.2, 7.3, 7.4, 5.2, 5.3
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  const body = await request.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Re-validate token + active event before accepting the submission.
  const result = await getInviteView(params.token);
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.status === "inactive") {
    return NextResponse.json({ error: "Event unavailable" }, { status: 403 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("rsvp").upsert(
    {
      guest_id: result.view.guestId,
      attendee_count: parsed.data.attendeeCount,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "guest_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
