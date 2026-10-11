"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="az-btn az-btn-gold az-btn-block"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [error, formAction] = useFormState(signInAction, null);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpeg"
            alt="AzMaNa"
            width={44}
            height={44}
            style={{ borderRadius: 10, objectFit: "cover" }}
          />
          <h1 style={{ margin: 0, fontSize: 22 }}>AzMaNa Admin</h1>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>
          Sign in to manage your events
        </p>

        <form action={formAction} className="az-card" style={{ textAlign: "left" }}>
          <label className="az-field">
            <span className="az-label">Email</span>
            <input
              className="az-input"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </label>
          <label className="az-field">
            <span className="az-label">Password</span>
            <input
              className="az-input"
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p role="alert" style={{ color: "crimson", margin: "0 0 12px" }}>
              {error}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
