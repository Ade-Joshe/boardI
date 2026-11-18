# boardI

Next.js 16 (App Router, TypeScript) with a hardened dev container and production image.

## Getting started

1. Install Docker and the VS Code **Dev Containers** extension.
2. Open the folder and run **Dev Containers: Reopen in Container**.
3. `pnpm dev`, then open the forwarded port (http://localhost:3000).

Don't run `pnpm install` on the host. Installing inside the container is the point (see below).

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint, with Next.js and extra security rules |
| `pnpm typecheck` | Route type generation and `tsc --noEmit` |
| `pnpm audit` | Fails on high/critical advisories in runtime dependencies |
| `pnpm test:security` | After `pnpm build`: checks CSP and security headers against the real production server |

## Security model

### Dev container: contain the dependency tree

The main development risk is a malicious or compromised npm package running code on your machine. The container keeps it away from your credentials:

- **Unprivileged user.** It runs as the `node` user with `--cap-drop=ALL` and `no-new-privileges`. The image is built from `node:*-slim`, so there is no `sudo`.
- **`node_modules` stays off the host.** It lives in a Docker volume, so host tools never execute dependency code.
- **Ports stay local.** Ports are forwarded by VS Code on `127.0.0.1` only. Don't add `appPort` or `-p`.

**Close the gap VS Code opens.** By default, Dev Containers forwards your git credential helper and SSH agent into the container. Anything running inside can then push as you to every repo you can reach. That includes an AI agent and a compromised dependency. `devcontainer.json` hides both from processes through `remoteEnv`, but the forwarding sockets still exist under `/tmp`. To remove them, add these to your VS Code **user** settings:

```jsonc
"dev.containers.copyGitConfig": false,
"dev.containers.gitCredentialHelperConfigLocation": "none"
```

Then either authenticate git inside the container with a fine-grained token scoped to this repo, or commit from the host. SSH agent forwarding happens whenever `SSH_AUTH_SOCK` is set on the host. Start VS Code without it. `.devcontainer/check-isolation.sh` runs on every attach and warns about any host credential it can still reach.

### AI agents

Assume the coding agent will eventually read something hostile: a package README, an issue, a web page or tool output. The controls are layered so that a prompt-injected agent has little to steal and can't quietly weaken the app:

- **Contained.** The agent runs in the dev container, where it can't reach host credentials (see above).
- **Permissions** (`.claude/settings.json`):
  - It is denied reads of `.env*`, keys and its own credentials.
  - It must ask before pushing, adding dependencies, or editing security-critical files (CSP, headers, supply-chain config, CI, container, tests).
  - These rules govern the agent's own tools. They are not a sandbox: a shell command can still `cat` a file. Containment and egress control are what actually enforce this.
- **Instructions.** `AGENTS.md` (loaded by `CLAUDE.md`) lists the invariants the agent must not break, plus rules for LLM features in the app.
- **Machine-checked invariants.** `pnpm test:security` fails if the CSP or headers weaken. CodeQL (`security-extended`) runs taint analysis on every PR. Review covers intent; the tools cover volume.
- **Hallucinated packages** ("slopsquatting"). The agent asks before adding dependencies. `minimumReleaseAge` and `trustPolicy` reject freshly published look-alikes.
- **Skills are code.** Host skills are mounted read-only from `~/skills`. Only put skills there whose content you've read.

### Supply chain (`pnpm-workspace.yaml`)

- **Release age.** `minimumReleaseAge: 4320` refuses versions less than 3 days old.
- **Provenance.** `trustPolicy: no-downgrade` fails the install if a package's publish provenance gets weaker than in earlier releases.
- **Install scripts.** `strictDepBuilds` and `allowBuilds` deny dependency install scripts. A new script fails the install until someone reviews it and adds it explicitly.
- **Sources.** `blockExoticSubdeps` means transitive dependencies may only come from the registry.
- **Exact pins.** Versions are pinned exactly, and `savePrefix: ''` keeps `pnpm add` doing the same.
- **CI.** GitHub Actions are pinned to commit SHAs, use `persist-credentials: false` and run with read-only `permissions`.
- **Updates.** Dependabot covers npm, Docker digests, the dev container and Actions, with a 3-day cooldown.

### Application

- **Nonce CSP** (`src/proxy.ts`). Every request gets a fresh nonce with `'strict-dynamic'`, so injected inline scripts don't run. This makes every page render dynamically (enforced in `src/app/layout.tsx`). If you'd rather keep static rendering, look at Next's experimental SRI mode.
- **Security headers** (`next.config.ts`):
  - HSTS, in production only
  - `nosniff`
  - `frame-ancestors 'none'` and `X-Frame-Options: DENY`
  - COOP and CORP
  - a restrictive Permissions-Policy
  - no `X-Powered-By`

  API routes get `default-src 'none'` and `no-store`.
- **Environment** (`src/lib/env.ts`). Variables are validated with zod at boot via `src/instrumentation.ts`. The module is marked `server-only`, so importing it from client code fails the build. Errors list variable names, never values.
- **ESLint** bans `eval`, `new Function`, `javascript:` URLs and `dangerouslySetInnerHTML`.

When you add features:

- Treat every Server Action and Route Handler as a public endpoint.
- Validate input with zod and check authorisation inside the action itself, not only in the proxy.
- Only `NEXT_PUBLIC_*` variables reach the browser.

### Production image (`Dockerfile`)

The image is built in multiple stages:

- **Build stage:** dependencies are installed with `--frozen-lockfile`.
- **Runtime stage:** distroless, `nonroot`. It has no shell or package manager, the app files are read-only, and only `.next/cache` is writable.

Run it with the runtime hardening too:

```sh
docker build -t boardi .
docker run --read-only --tmpfs /tmp \
  --tmpfs /app/.next/cache:uid=65532,gid=65532 \
  --cap-drop=ALL --security-opt=no-new-privileges:true \
  -p 127.0.0.1:3000:3000 boardi
```

Use `/api/health` for liveness probes.

## Decisions and known gaps

- **ESLint 10.** `eslint-plugin-react`, `-import` and `-jsx-a11y` haven't widened their peer range to ESLint 10 yet. They're allowed in `peerDependencyRules` after being verified, because ESLint 9 is out of support.
- **Two unpatched advisories in lint tooling.** `picomatch` (GHSA-fc5q-39xc-vjpf, no fix yet) and `minimatch` (GHSA-g3hv-75wg-m249) only process globs we write ourselves. The blocking audit therefore covers runtime dependencies only. On the first PR, `dependency-review` will flag them until upstream ships fixes.
- **Not included:** authentication, rate limiting, a database and secret management. Add them with the same posture.
- **No egress control in the dev container yet.** Code in the container, including the agent, can reach any host. The next step is an allowlisting egress proxy: put the container on an `internal` Docker network with a proxy that permits only the npm registry, GitHub and the model API. That stops credential and source exfiltration, even by code that runs.
- **Repo settings to enable on GitHub:** secret scanning with push protection, branch protection on `main` with required CI and review, and a `CODEOWNERS` entry for the security-critical files listed in `.claude/settings.json`.
