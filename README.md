# boardI

Next.js 16 (App Router, TypeScript) with a hardened dev container and production image.

## Getting started

1. Install Docker and the VS Code **Dev Containers** extension.
2. Open the folder and run **Dev Containers: Reopen in Container**.
3. Apply the VS Code user settings in [Close the gap VS Code opens](docs/security-model.md#dev-container-contain-the-dependency-tree).
4. `pnpm dev`, then open the forwarded port (http://localhost:3000).

Don't run `pnpm install` on the host. Installing inside the container keeps dependency code away from your credentials.

## Scripts

| Script                  | What it does                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`              | Dev server (Turbopack)                                                                        |
| `pnpm build`            | Production build. The standalone output runs as-is: static files and `public/` are copied in. |
| `pnpm start`            | Serves the build (`.next/standalone/server.js`)                                               |
| `pnpm lint`             | ESLint: Next.js rules plus [our standards](docs/standards/README.md)                          |
| `pnpm typecheck`        | Route type generation and `tsc --noEmit`                                                      |
| `pnpm test`             | All tests (run `pnpm build` first)                                                            |
| `pnpm test:security`    | CSP and security headers, checked against the real production server                          |
| `pnpm test:conventions` | File naming and comment length                                                                |
| `pnpm audit`            | Fails on high or critical advisories in runtime dependencies                                  |

Git hooks install with `pnpm install`:

- **pre-commit:** lint, format and typecheck
- **commit-msg:** checks the Conventional Commits format
- **pre-push:** blocks pushes to `main`, then runs the CI checks

## Browser testing (development)

The dev container includes headless Chromium and a [Playwright MCP](https://github.com/microsoft/playwright-mcp) server (`.mcp.json`), so Claude can open the app, read the console and network, and take screenshots.

1. Approve the `playwright` MCP server the first time Claude Code asks.
2. Run `pnpm dev`, then ask Claude to check a page, e.g. "open / and report console errors".

Screenshots are saved to the git-ignored `.playwright-mcp/` folder. The browser may only load `http://localhost:3000`. See the [security model](docs/security-model.md#ai-agents) for the trade-offs.

## Production image

```sh
docker build -t boardi .
docker run --read-only --tmpfs /tmp \
  --tmpfs /app/.next/cache:uid=65532,gid=65532 \
  --cap-drop=ALL --security-opt=no-new-privileges:true \
  -p 127.0.0.1:3000:3000 boardi
```

Use `/api/health` for liveness probes. [Why it's built this way](docs/security-model.md#production-image).

## Documentation

| Document                                         | Read it when you want to…                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [docs/standards/](docs/standards/README.md)      | write code: rules by area (code, server, components, tests, security config, dependencies), git rules and how each is enforced |
| [docs/security-model.md](docs/security-model.md) | understand what protects the project and why, plus known gaps                                                                  |
| [SECURITY.md](SECURITY.md)                       | report a vulnerability                                                                                                         |
| [AGENTS.md](AGENTS.md)                           | see the instructions AI coding agents follow (`CLAUDE.md` loads it)                                                            |
| [PR template](.github/pull_request_template.md)  | open a pull request                                                                                                            |
