import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "boardI",
  description: "boardI",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The CSP nonce is per request, so pages must render dynamically.
  // Prerendered pages would ship un-nonced scripts the browser blocks.
  await connection();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
