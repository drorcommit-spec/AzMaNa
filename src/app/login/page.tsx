"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [error, formAction] = useFormState(signInAction, null);

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpeg"
          alt="AzMaNa"
          width={40}
          height={40}
          style={{ borderRadius: 8, objectFit: "cover" }}
        />
        <h1 style={{ margin: 0 }}>AzMaNa Admin</h1>
      </div>
      <form action={formAction}>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p role="alert" style={{ color: "crimson" }}>
            {error}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </main>
  );
}
