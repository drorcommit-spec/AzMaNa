import type { ReactNode } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/login/actions";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <header className="az-appbar">
        <Link
          href="/admin"
          style={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpeg"
            alt="AzMaNa"
            width={30}
            height={30}
            style={{ borderRadius: 6, objectFit: "cover" }}
          />
          AzMaNa
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </form>
      </header>
      <div className="az-container">{children}</div>
    </div>
  );
}
