// Liveness probe. Deliberately reveals nothing (no version, uptime or env).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
