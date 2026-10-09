import type { ReactNode } from "react";

export const metadata = {
  title: "AzMaNa",
  description: "Private event invitations",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
