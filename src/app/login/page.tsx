"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction, signInWithGoogleAction } from "./actions";

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

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="az-btn az-btn-block"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.15)",
        color: "#1f1f1f",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt=""
        width={18}
        height={18}
      />
      {pending ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}

export default function LoginPage() {
  const [error, formAction] = useFormState(signInAction, null);
  const [oauthError, oauthAction] = useFormState(signInWithGoogleAction, null);

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

        <div className="az-card" style={{ textAlign: "left" }}>
          <form action={formAction}>
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "16px 0",
              color: "var(--muted)",
              fontSize: 12,
            }}
          >
            <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
            or
            <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
          </div>

          {oauthError ? (
            <p role="alert" style={{ color: "crimson", margin: "0 0 12px" }}>
              {oauthError}
            </p>
          ) : null}
          <form action={oauthAction}>
            <GoogleButton />
          </form>
        </div>
      </div>
    </main>
  );
}
