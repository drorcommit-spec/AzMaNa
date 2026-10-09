import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/events/[id]/guests/[gid]/sent — mark a guest's invitation as sent.
 * Body: { sent: boolean }. Sets invite_sent_at to now when sent, null to reset.
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

  const body = await request.json().catch(() => ({}));
  const sent = body?.sent !== false; // default true

  const { data, error } = await supabase
    .from("guest")
    .update({ invite_sent_at: sent ? new Date().toISOString() : null })
    .eq("id", params.gid)
    .eq("event_id", params.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
