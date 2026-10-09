import type { ReactNode } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/login/actions";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Link
          href="/admin"
          style={{
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpeg"
            alt="AzMaNa"
            width={32}
            height={32}
            style={{ borderRadius: 6, objectFit: "cover" }}
          />
          AzMaNa Admin
        </Link>
        <form action={signOutAction}>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main style={{ padding: "1.25rem" }}>{children}</main>
    </div>
  );
}
