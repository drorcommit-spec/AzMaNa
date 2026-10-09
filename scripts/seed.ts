/**
 * Seeds admin accounts into Supabase Auth. There is no public signup, so this
 * script is the way to create organizer logins. (Req 1.1)
 *
 * Usage:
 *   1. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   2. Define admins below (or via ADMIN_SEED env as JSON [{email,password}])
 *   3. npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Minimal .env loader (avoids an extra dependency).
function loadEnv() {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file; rely on the ambient environment.
  }
}

type AdminSeed = { email: string; password: string };

function getAdmins(): AdminSeed[] {
  if (process.env.ADMIN_SEED) {
    return JSON.parse(process.env.ADMIN_SEED) as AdminSeed[];
  }
  // Default seed accounts. Change these before running in any real project.
  return [{ email: "dror.shem.tov@gmail.com", password: "12345678" }];
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const admin of getAdmins()) {
    const { error } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`Failed to create ${admin.email}: ${error.message}`);
    } else {
      console.log(`Created admin: ${admin.email}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
