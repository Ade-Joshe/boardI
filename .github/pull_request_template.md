## Summary

<!-- What changed and why. One concern per PR. -->

## Ticket

<!-- Link to the issue or ticket, or "n/a". -->

## Change type

<!-- Tick one. It should match the PR title's Conventional Commit type. -->

- [ ] `feat`: new feature
- [ ] `fix`: bug fix
- [ ] `perf`: performance improvement
- [ ] `refactor`: no behaviour change
- [ ] `docs`: documentation only
- [ ] `test`: tests only
- [ ] `build` / `ci` / `chore`: tooling, dependencies, pipeline
- [ ] Breaking change (title uses `!`, e.g. `feat!: …`)

## How to test

<!-- Steps a reviewer can follow, and what they should see. -->

1.

## Changes checklist

Rules: `docs/standards/`.

- [ ] Title follows Conventional Commits (`feat(scope): summary`)
- [ ] One concern, under ~400 changed lines (lockfile excluded)
- [ ] Logic, validation, authorisation or security changes have tests written first
- [ ] Bug fixes include a regression test
- [ ] Performance considered: no new N+1 queries, oversized client bundles or blocking work
- [ ] Documented: README, `docs/` or code comments updated where behaviour changed
- [ ] No security rule weakened (CSP, headers, lint, supply chain, CI)
- [ ] Any new dependency is justified, exists, isn't a look-alike name and is pinned
- [ ] I've read every changed line, including agent-written code

## Additional information

<!-- Screenshots, follow-ups, risks, rollout notes, or anything else. -->
