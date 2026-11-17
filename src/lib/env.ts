import "server-only";
import { z } from "zod";

// Server-side environment, validated once at startup. Importing this from a
// Client Component fails the build (server-only), so secrets can't be bundled
// for the browser by mistake. Only NEXT_PUBLIC_* variables ever reach the client.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Add secrets here, e.g.:
  // DATABASE_URL: z.url(),
  // SESSION_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Log variable names and reasons only, never the values.
  const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  throw new Error(`Invalid environment variables:\n${problems.join("\n")}`);
}

export const env = parsed.data;
