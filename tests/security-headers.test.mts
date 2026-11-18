// Checks CSP and headers on the real production server.
// Run `pnpm build` first. If it fails, fix the code, not the test.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

const SERVER = ".next/standalone/server.js";
let server: ChildProcess;
let base: string;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer().listen(0, "127.0.0.1", () => {
      const addr = s.address();
      s.close(() =>
        typeof addr === "object" && addr ? resolve(addr.port) : reject()
      );
    });
  });
}

async function waitUntilUp(url: string, ms = 20_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server did not start within ${ms}ms`);
}

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .flatMap(([name, ...values]) => (name ? [[name, values] as const] : []))
  );
}

before(async () => {
  assert.ok(existsSync(SERVER), `${SERVER} missing: run \`pnpm build\` first`);
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: "ignore",
  });
  await waitUntilUp(`${base}/api/health`);
});

after(() => {
  server?.kill();
});

describe("pages", () => {
  it("send a strict nonce-based CSP", async () => {
    const res = await fetch(base);
    const csp = res.headers.get("content-security-policy");
    assert.ok(csp, "missing Content-Security-Policy");
    const d = directives(csp);

    const script = d.get("script-src") ?? [];
    assert.ok(
      script.some((v) => /^'nonce-[A-Za-z0-9+/=]{16,}'$/.test(v)),
      "script-src needs a nonce"
    );
    assert.ok(script.includes("'strict-dynamic'"));
    for (const unsafe of [
      "'unsafe-inline'",
      "'unsafe-eval'",
      "*",
      "https:",
      "data:",
    ]) {
      assert.ok(
        !script.includes(unsafe),
        `script-src must not allow ${unsafe}`
      );
    }
    assert.ok(!(d.get("style-src") ?? []).includes("'unsafe-inline'"));
    assert.deepEqual(d.get("object-src"), ["'none'"]);
    assert.deepEqual(d.get("frame-ancestors"), ["'none'"]);
    assert.deepEqual(d.get("base-uri"), ["'self'"]);
    // Tight img/connect sources stop rendered content (e.g. an LLM's
    // markdown image) from sending data to other servers.
    assert.deepEqual(d.get("connect-src"), ["'self'"]);
    assert.ok(
      (d.get("img-src") ?? []).every((v) =>
        ["'self'", "blob:", "data:"].includes(v)
      )
    );
  });

  it("use a fresh nonce per request, applied to the page's scripts", async () => {
    const nonceOf = async () => {
      const res = await fetch(base);
      const nonce = /'nonce-([^']+)'/.exec(
        res.headers.get("content-security-policy") ?? ""
      )?.[1];
      return { nonce, html: await res.text() };
    };
    const a = await nonceOf();
    const b = await nonceOf();
    assert.ok(a.nonce && b.nonce);
    assert.notEqual(a.nonce, b.nonce);
    assert.ok(
      a.html.includes(`nonce="${a.nonce}"`),
      "rendered scripts must carry the nonce"
    );
  });

  it("send the static hardening headers", async () => {
    const h = (await fetch(base)).headers;
    assert.match(h.get("strict-transport-security") ?? "", /max-age=\d{7,}/);
    assert.equal(h.get("x-content-type-options"), "nosniff");
    assert.equal(h.get("x-frame-options"), "DENY");
    assert.equal(h.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(h.get("x-powered-by"), null);
  });
});

describe("API routes", () => {
  it("are locked down and uncached", async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(
      res.headers.get("content-security-policy"),
      "default-src 'none'; frame-ancestors 'none'"
    );
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(await res.json(), { status: "ok" });
  });
});
