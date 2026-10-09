import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventCreateSchema } from "@/lib/validation/schemas";

/**
 * POST /api/events — create an event owned by the authenticated admin.
 * Requirements: 2.1, 2.4
 */
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { language, imageUrl, address, greeting, eventDate, eventTime } =
    parsed.data;
  const { data, error } = await supabase
    .from("event")
    .insert({
      owner_id: user.id,
      language,
      image_url: imageUrl,
      address,
      greeting,
      event_date: eventDate,
      event_time: eventTime,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
