import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "boardI",
  description: "boardI",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The CSP nonce is per request, so pages must render dynamically.
  // Prerendered pages would ship un-nonced scripts the browser blocks.
  await connection();

  return (
    // Browser extensions add attributes to <html>/<body> before hydration.
    // This ignores only those two tags; deeper mismatches still surface.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
