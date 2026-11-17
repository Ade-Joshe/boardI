import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "boardI",
  description: "boardI",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The CSP nonce only exists at request time, so every page must be rendered
  // dynamically. A statically prerendered page would ship scripts without the
  // nonce, and the browser would block them.
  await connection();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
