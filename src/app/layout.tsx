import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "AzMaNa",
  description: "Private event invitations",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
