---
paths:
  - "tests/**"
  - "**/*.test.*"
---

# Tests

- Logic, validation, authorisation and security changes: write the failing test first. [review]
- Every bug fix gets a regression test that fails without the fix. [review]
- Layout and styling changes need no tests.
- If a security test fails, fix the code, never the test. [review]
- `node:test` in `tests/`, which can't import `next/*`. `pnpm test` runs everything; run `pnpm build` first.
