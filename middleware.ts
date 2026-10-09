import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on admin pages and admin API routes so the Supabase session is
  // refreshed and available to Route Handlers (needed for RLS-scoped writes).
  matcher: ["/admin/:path*", "/api/events/:path*"],
};
