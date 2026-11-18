# Security model

What protects this project, and why. The rules that follow from it are in [standards](standards/README.md). To report a vulnerability, see [SECURITY.md](../SECURITY.md).

## Threats this setup is built around

1. **A malicious or compromised dependency** running code on a developer's machine, in CI, or in production.
2. **A prompt-injected AI agent.** The coding agent reads something hostile (a README, an issue, a web page) and acts on it with the developer's access.
3. **Classic web attacks** on the app: XSS, clickjacking, injection, leaked secrets.

## Dev container: contain the dependency tree

All installs and builds happen in the container, so dependency code can't reach host credentials (`~/.ssh`, `~/.aws`, the keychain).

- **Unprivileged.** The container runs as `node`, with `--cap-drop=ALL` and `no-new-privileges`. The base is `node:*-slim`, so there's no `sudo`.
- **`node_modules` stays off the host.** It lives in a per-container Docker volume, so host tools never execute dependency code.
- **Ports stay local.** VS Code forwards ports on `127.0.0.1` only. Don't add `appPort` or `-p`.

**Close the gap VS Code opens.** By default, Dev Containers forwards your git credential helper and SSH agent into the container. Anything running inside could then push as you to every repo you can reach. `devcontainer.json` hides both from processes through `remoteEnv`, but the forwarding sockets still exist under `/tmp`. To remove them, add these to your VS Code **user** settings:

```jsonc
"dev.containers.copyGitConfig": false,
"dev.containers.gitCredentialHelperConfigLocation": "none"
```

Then authenticate git inside the container with a fine-grained token scoped to this repo, or commit from the host. SSH agent forwarding happens whenever `SSH_AUTH_SOCK` is set on the host, so start VS Code without it. `.devcontainer/check-isolation.sh` runs on every attach and warns about any host credential it can still reach.

## AI agents

Assume the agent will eventually read something hostile. The layers below aim to leave a prompt-injected agent with little to steal and no quiet way to weaken the app.

- **Contained.** The agent runs in the dev container, away from host credentials (see above).
- **Permissions** (`.claude/settings.json`):
  - It is denied reads of `.env*`, keys and its own credentials.
  - It must ask before pushing, adding dependencies, or editing security-critical files: CSP, headers, supply-chain config, CI, the container, tests, hooks and these docs.
  - These rules govern the agent's own tools, not a sandbox: a shell command can still `cat` a file. Containment and egress control are what actually enforce this.
- **Instructions.** [AGENTS.md](../AGENTS.md) holds repo-wide rules and is always loaded. [docs/standards/](standards/README.md) holds rules by area, which Claude loads only when it touches matching files.
- **Machine-checked invariants.** Rules that matter are enforced by tests, lint, hooks and CI, not just prose. Agents follow a failing check more reliably than a sentence, and review can't keep up with the volume of code agents produce.
- **Hallucinated packages** ("slopsquatting"). The agent asks before adding dependencies, and `minimumReleaseAge` and `trustPolicy` reject freshly published look-alikes.
- **Agent browser (development only).** The Playwright MCP server drives headless Chromium inside the container:
  - The profile is in memory, so no cookies or sessions persist.
  - It may only load `http://localhost:3000`. Playwright notes this isn't a hard boundary; egress control is the real one.
  - Chromium's own sandbox is off because `--cap-drop=ALL` blocks it; the container is the sandbox.
  - `browser_run_code_unsafe`, which runs code in the server process, is denied.
  - Screenshots land in the git-ignored `.playwright-mcp/` folder.
- **Skills are code.** Host skills are mounted read-only from `~/skills`. Only put skills there whose content you've read.

## Supply chain

Configured in `pnpm-workspace.yaml`:

- **Release age.** `minimumReleaseAge: 4320` refuses versions less than 3 days old.
- **Provenance.** `trustPolicy: no-downgrade` fails the install if a package's publish provenance is weaker than in its earlier releases.
- **Install scripts.** `strictDepBuilds` and `allowBuilds` deny dependency install scripts. A new script fails the install until someone reviews it.
- **Sources.** `blockExoticSubdeps` means transitive dependencies come only from the registry.
- **Exact pins.** `savePrefix: ''` keeps `pnpm add` pinning exact versions.

CI and updates:

- **GitHub Actions** are pinned to commit SHAs, use `persist-credentials: false` and run with least-privilege `permissions`.
- **CodeQL** (`security-extended`) runs taint analysis on every PR, covering both the code and the workflows.
- **Dependabot** covers npm, both Dockerfiles' base images, the dev container and Actions. npm and Actions updates wait 3 days.

## Application

- **Nonce CSP** (`src/proxy.ts`). Every request gets a fresh nonce with `'strict-dynamic'`, so injected inline scripts and inline styles don't run. This forces dynamic rendering (see `src/app/layout.tsx`); Next's experimental SRI mode is the alternative if static rendering is needed. Dev allows inline styles and `eval`; production doesn't.
- **Tight `img-src` and `connect-src`.** Rendered content, such as LLM output containing a markdown image, can't send data to another origin.
- **Security headers** (`next.config.ts`):
  - HSTS, in production only
  - `nosniff`
  - frame denial (`frame-ancestors 'none'` and `X-Frame-Options: DENY`)
  - COOP and CORP
  - a restrictive Permissions-Policy
  - no `X-Powered-By`

  API routes get `default-src 'none'` and `no-store`.

- **Environment** (`src/lib/env.ts`). Variables are validated with zod at boot via `src/instrumentation.ts`. `server-only` makes a client import fail the build. Errors list variable names, never values.
- **Lint** bans `eval`, `new Function`, `javascript:` URLs, `dangerouslySetInnerHTML` and inline `style` attributes.
- **Regression tests.** `pnpm test:security` starts the real production server and fails if the CSP or headers weaken.

## Production image

The image is built in stages from the [Dockerfile](../Dockerfile):

- **Build stage:** dependencies are installed with `--frozen-lockfile`.
- **Runtime stage:** distroless `nonroot` from Google's distroless project (`gcr.io`), pinned by digest.
  - It has no shell, package manager or coreutils. `docker run --entrypoint sh` fails.
  - App files are root-owned and read-only. Only `.next/cache` is writable.

The hardened run command is in the [README](../README.md#production-image).

## Known gaps

- **No egress control in the dev container.** Code in the container, including the agent, can reach any host. The planned fix is an allowlisting proxy on an `internal` Docker network, permitting the npm registry, GitHub, the model API, the VS Code marketplace, and Google Fonts (`next/font/google` downloads fonts at build time).
- **Unpatched advisories in lint tooling.** `picomatch` (GHSA-fc5q-39xc-vjpf) and `minimatch` (GHSA-g3hv-75wg-m249) only process globs we write ourselves, so the blocking audit covers runtime deps only. `dependency-review` will flag them until fixes ship.
- **Not built yet:** authentication, rate limiting, a database and secret management. Add them under the same rules.
- **GitHub settings to enable:**
  - private vulnerability reporting (needed by [SECURITY.md](../SECURITY.md))
  - secret scanning with push protection
  - branch protection on `main` requiring CI and one approval
  - `CODEOWNERS` for the security-critical files
