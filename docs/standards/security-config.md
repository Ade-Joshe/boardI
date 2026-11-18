---
paths:
  - "src/proxy.ts"
  - "src/instrumentation.ts"
  - "next.config.ts"
  - "eslint.config.mjs"
  - "Dockerfile"
  - ".devcontainer/**"
  - ".github/**"
  - ".husky/**"
---

# Security config

Never weaken any of this; stop and ask instead. The reasons are in `docs/security-model.md`.

- CSP (`src/proxy.ts`): a nonce on every request, and no `'unsafe-inline'` or `'unsafe-eval'` in production. `img-src` and `connect-src` stay `'self'` (images may also use `blob:` and `data:`). [test]
- Headers (`next.config.ts`): keep all of them: HSTS, nosniff, frame denial, COOP/CORP, Permissions-Policy. [test]
- Never disable security lint rules or skip hooks. [review]
- CI:
  - Pin actions to commit SHAs of releases at least 2 weeks old. Set `persist-credentials: false`.
  - Keep `permissions` read-only, widening per job only when needed.
  - Pass `${{ }}` values to `run:` via `env:`, never inline. [CodeQL, review]
- Dev container: no added capabilities, `sudo`, `-p`/`appPort` or host mounts. [review]
- Production image: distroless `nonroot`, pinned by digest, with read-only app files. [review]
