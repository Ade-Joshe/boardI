---
paths:
  - "src/**/*.{ts,tsx}"
---

# Server code

- Server Actions and Route Handlers are public endpoints: validate input with zod and check authorisation inside each one. [review, CodeQL]
- Expected failures (bad input, not found, forbidden) return a `Result`. Bugs throw to `error.tsx`. [review]
  `type Result<T, E extends string = string> = { ok: true; data: T } | { ok: false; error: E };`
- `notFound()`, `redirect()` and `forbidden()` throw by design; use them as normal.
- Never send raw errors or stack traces to the client; log them on the server. [review]
- Config comes only from `src/lib/env.ts`. Nothing secret gets a `NEXT_PUBLIC_` prefix. [build: server-only]
- Data access layer: not decided yet. Until then, keep data access on the server, with authorisation in each call. [review]

## LLM features

- Call models from the server only; keys live in `env.ts`. [build]
- Model output is untrusted: render it as text. Never pass it unvalidated to eval, SQL, a shell, HTML, redirects or fetch URLs. [lint, review]
- Prompts may contain injected instructions. Tools the model can call are least-privilege and scoped to the current user; destructive or outward-facing actions need a human to confirm. [review]
- Per-user rate limits, token caps and timeouts. Don't log prompts or completions that may hold personal data. [review]
