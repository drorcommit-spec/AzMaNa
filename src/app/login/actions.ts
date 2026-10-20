"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Signs an admin in with email/password via Supabase Auth. (Req 1.1, 1.2)
 * Returns an error message string on failure; redirects to /admin on success.
 */
export async function signInAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return "Invalid email or password.";
  }

  redirect("/admin");
}

/**
 * Starts the Google OAuth sign-in flow. Supabase returns a URL we redirect
 * the browser to; Google then returns the user to /auth/callback where the
 * code is exchanged for a session. New users are provisioned automatically.
 */
export async function signInWithGoogleAction(
  _prev: string | null,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return "Could not start Google sign-in. Please try again.";
  }

  redirect(data.url);
}

/** Terminates the admin session and returns to the login page. (Req 1.4) */
export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
