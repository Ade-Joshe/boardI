# Engineering standards

How code in this repo is written. The files below are the single source of truth for humans and AI agents.

| File                                     | Covers                                   | Applies to                  |
| ---------------------------------------- | ---------------------------------------- | --------------------------- |
| [code.md](code.md)                       | Exports, types, naming, layout, comments | All TS, CSS and scripts     |
| [server.md](server.md)                   | Endpoints, errors, config, LLM features  | `src/**/*.{ts,tsx}`         |
| [components.md](components.md)           | Server/client split, styling, raw HTML   | `src/**/*.{tsx,css}`        |
| [tests.md](tests.md)                     | Test-first, regressions                  | `tests/`, `*.test.*`        |
| [security-config.md](security-config.md) | CSP, headers, CI, container, image       | Security config files       |
| [dependencies.md](dependencies.md)       | Adding and pinning packages              | `package.json`, pnpm config |

Repo-wide rules (git, secrets, untrusted input) are in [AGENTS.md](../../AGENTS.md). The reasons behind the security rules are in [security-model.md](../security-model.md).

## How agents load these

To save tokens, each file starts with a `paths:` field and is symlinked into `.claude/rules/`. Claude Code loads a file only when it reads or edits a matching file ([docs](https://code.claude.com/docs/en/memory#path-specific-rules)). Other agents get pointed here from `AGENTS.md`.

When writing rules:

- Keep them terse: one imperative rule per bullet. Use no tables, because their padding doubles the token cost.
- Tag what enforces each rule. Prefer tool enforcement over prose: a failing check costs nothing until it fires.
- Change a rule and its enforcement in the same PR.

## Enforcement tags

- `[lint]`: ESLint (`eslint.config.mjs`)
- `[test]`: `tests/`
- `[hook]`: git hooks in `.husky/`
- `[build]`: the build fails
- `[CodeQL]`, `[audit]`, `[dependency review]`: CI
- `[review]`: nothing automated, so the reviewer checks it. These are candidates for automation.

## Where checks run

| Stage      | What runs                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| pre-commit | `lint-staged` (ESLint `--fix`, Prettier), `pnpm typecheck`                      |
| commit-msg | Conventional Commits format                                                     |
| pre-push   | Blocks pushes to `main`, then lint, build, `pnpm test`, audit                   |
| CI         | Lint, typecheck, build, `pnpm test`, audit, dependency review, CodeQL, PR title |

`--no-verify` skips the hooks; nothing skips CI once branch protection is on.

## Git and PRs

- [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`. [hook, CI]
- Small PRs: one concern, under ~400 changed lines (lockfile excluded). [review]
- No direct pushes to `main`. Changes land through a squash-merged PR with green CI and one approval. [hook; branch protection _to enable_]
- Fill in the [PR template](../../.github/pull_request_template.md). [review]

## Open decisions

- **Data access layer:** should all DB, API and LLM calls go through one `server-only` layer that checks authorisation and returns trimmed DTOs? TBD.
- **Unit test runner:** `node:test` can't import `next/*`. Pick Vitest (or similar) when that's first needed. TBD.
- **CODEOWNERS** for security-critical files: needs the owners' GitHub usernames. TBD.
- **Changelog:** release-please (commit-based) is the candidate. TBD.

## Tooling notes

- **ESLint 10:** `eslint-plugin-react`, `-import` and `-jsx-a11y` don't list ESLint 10 as a peer yet. They're allowed in `peerDependencyRules` after being verified to work, since ESLint 9 is out of support.
