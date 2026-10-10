import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guestCreateSchema } from "@/lib/validation/schemas";

/**
 * POST /api/events/[id]/guests/import — bulk add guests.
 * Body: { guests: [{ firstName, lastName, mobile, predictedGuests, familyRelation }] }
 * Inserts valid rows; skips duplicates (same mobile in the event) and invalid
 * rows, reporting counts. RLS scopes inserts to the owner's event.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.guests) ? body.guests : null;
  if (!incoming) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Existing mobiles in this event, to skip duplicates up front.
  const { data: existing } = await supabase
    .from("guest")
    .select("mobile")
    .eq("event_id", params.id);
  const existingMobiles = new Set((existing ?? []).map((g) => g.mobile));

  let added = 0;
  let skipped = 0;
  const seen = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];

  for (const raw of incoming) {
    const parsed = guestCreateSchema.safeParse(raw);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const g = parsed.data;
    if (existingMobiles.has(g.mobile) || seen.has(g.mobile)) {
      skipped++;
      continue;
    }
    seen.add(g.mobile);
    toInsert.push({
      event_id: params.id,
      first_name: g.firstName,
      last_name: g.lastName,
      mobile: g.mobile,
      predicted_guests: g.predictedGuests,
      family_relation: g.familyRelation ?? null,
    });
  }

  if (toInsert.length > 0) {
    const { error, count } = await supabase
      .from("guest")
      .insert(toInsert, { count: "exact" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    added = count ?? toInsert.length;
  }

  return NextResponse.json({ added, skipped });
}
