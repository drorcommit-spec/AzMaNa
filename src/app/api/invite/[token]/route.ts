import { NextResponse } from "next/server";
import { getInviteView } from "@/lib/invite/getInviteView";

/**
 * GET /api/invite/[token] — public invite view model.
 * Returns the minimal view only for a valid token on an active event;
 * otherwise signals denial (404) or unavailable (403) without leaking data.
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
 */
export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const result = await getInviteView(params.token);

  if (result.status === "not_found") {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }
  if (result.status === "inactive") {
    return NextResponse.json({ status: "inactive" }, { status: 403 });
  }

  return NextResponse.json({ status: "ok", view: result.view });
}
