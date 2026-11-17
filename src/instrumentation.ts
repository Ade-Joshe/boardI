// Runs once when the server boots: validate the environment up front so a
// misconfigured deploy fails at start instead of on the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
