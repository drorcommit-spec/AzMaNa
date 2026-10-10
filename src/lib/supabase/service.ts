import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the service role key.
 *
 * SERVER ONLY. This client bypasses Row Level Security, so it must never be
 * imported into client code. It is used by the public invite Route Handlers
 * to validate guest tokens and enforce active-event checks in code, returning
 * only a minimal view model to guests.
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Prevent Next.js from caching Supabase REST responses so the invite
        // page always reflects the latest event settings.
        fetch: (input, init) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    },
  );
}
