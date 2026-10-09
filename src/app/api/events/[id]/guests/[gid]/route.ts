import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guestUpdateSchema } from "@/lib/validation/schemas";

const DUPLICATE_MOBILE_MESSAGE =
  "A guest with this mobile number already exists for this event.";

/**
 * PATCH /api/events/[id]/guests/[gid] — edit a guest.
 * Requirements: 3.3, 3.2
 */
export async function PATCH(
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
  const parsed = guestUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.firstName !== undefined) update.first_name = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) update.last_name = parsed.data.lastName;
  if (parsed.data.mobile !== undefined) update.mobile = parsed.data.mobile;
  if (parsed.data.predictedGuests !== undefined)
    update.predicted_guests = parsed.data.predictedGuests;
  if (parsed.data.familyRelation !== undefined)
    update.family_relation = parsed.data.familyRelation;

  const { data, error } = await supabase
    .from("guest")
    .update(update)
    .eq("id", params.gid)
    .eq("event_id", params.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: DUPLICATE_MOBILE_MESSAGE }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ id: data.id });
}

/**
 * DELETE /api/events/[id]/guests/[gid] — remove a guest.
 * Requirements: 3.3
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; gid: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("guest")
    .delete()
    .eq("id", params.gid)
    .eq("event_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
