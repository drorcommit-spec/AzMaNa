import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventUpdateSchema } from "@/lib/validation/schemas";

/**
 * PATCH /api/events/[id] — update event settings and/or active state.
 * RLS restricts the update to events owned by the authenticated admin.
 * Requirements: 2.5, 8.2, 8.3
 */
export async function PATCH(
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
  const parsed = eventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.language !== undefined) update.language = parsed.data.language;
  if (parsed.data.imageUrl !== undefined) update.image_url = parsed.data.imageUrl;
  if (parsed.data.address !== undefined) update.address = parsed.data.address;
  if (parsed.data.greeting !== undefined) update.greeting = parsed.data.greeting;
  if (parsed.data.eventDate !== undefined) update.event_date = parsed.data.eventDate;
  if (parsed.data.eventTime !== undefined) update.event_time = parsed.data.eventTime;
  if (parsed.data.isActive !== undefined) update.is_active = parsed.data.isActive;

  const { data, error } = await supabase
    .from("event")
    .update(update)
    .eq("id", params.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ id: data.id });
}
