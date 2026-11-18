---
paths:
  - "src/**/*.{ts,tsx,mts,css}"
  - "tests/**/*.mts"
  - "scripts/**/*.mjs"
---

# Code

Tags show what enforces each rule; `[review]` means nothing automated does.

- Named exports only. Default exports only where Next.js or a tool requires them (`page`, `layout`, `*.config.*`). [lint]
- No `any`: use `unknown` and narrow it, or parse it with zod. [lint]
- No non-null assertions (`foo!`); handle the missing case. [lint]
- No `@ts-ignore`. `@ts-expect-error` only with a reason. [lint]
- Avoid `as` except `as const`; validate data at the boundary. [review]
- kebab-case file and folder names. `(group)`, `[id]`, `_private` and `@slot` segments are fine. [test]
- Colocate by feature; shared code goes in `src/components/` (UI) and `src/lib/` (non-UI). [review]
  `src/app/(dashboard)/boards/{page.tsx, actions.ts, _components/board-card.tsx}`
- Comments: at most 2 lines of 80 characters, in every file type. Say why, not what. [test]
- Prettier owns formatting. [hook]
