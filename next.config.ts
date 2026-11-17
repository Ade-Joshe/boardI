import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static security headers for every response. The Content-Security-Policy for
// pages is set per request in src/proxy.ts because it carries a nonce.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Relax to "same-site" if assets are served from a CDN subdomain.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Add `preload` only once every subdomain is HTTPS; it is hard to undo.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // API routes skip the proxy, so give them a locked-down CSP of their own.
        // They return data, never documents.
        source: "/api/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
