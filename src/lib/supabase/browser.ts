import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components (browser context).
 * Uses the public anon key and respects Row Level Security.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
