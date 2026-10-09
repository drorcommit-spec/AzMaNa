import type { ReactNode } from "react";

export const metadata = {
  title: "AzMaNa",
  description: "Private event invitations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
