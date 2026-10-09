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

/** Terminates the admin session and returns to the login page. (Req 1.4) */
export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
