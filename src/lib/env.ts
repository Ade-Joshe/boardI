import "server-only";
import { z } from "zod";

// Server env, validated at boot. `server-only` makes a client import
// fail the build, so secrets never reach the browser.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Add secrets here, e.g. DATABASE_URL: z.url(),
  // SESSION_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Log names and reasons only, never values.
  const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
  throw new Error(`Invalid environment variables:\n${problems.join("\n")}`);
}

export const env = parsed.data;
