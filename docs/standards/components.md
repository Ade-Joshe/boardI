---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Components

- Server Components by default. [review]
- `"use client"` goes only on the smallest leaf that needs it, never on a page or layout. [lint for pages and layouts]
- Style with Tailwind utility classes. No CSS Modules. [review]
- Design tokens (colours, fonts) go in `@theme` in `src/app/globals.css`, not as repeated arbitrary values like `bg-[#383838]`. [review]
- No inline `style` on DOM elements; use a Tailwind class. The production CSP blocks inline styles, but dev doesn't. [lint]
- No `dangerouslySetInnerHTML`. An exception needs approval, sanitising and a reason on the line. [lint]
