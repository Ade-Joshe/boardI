// Runs once at boot: a bad env fails the deploy at start,
// not on the first request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
