---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Components

- Server Components by default. [review]
- `"use client"` goes only on the smallest leaf that needs it, never on a page or layout. [lint for pages and layouts]
- No inline `style` on DOM elements; use CSS Modules. The production CSP blocks inline styles, but dev doesn't. [lint]
- No `dangerouslySetInnerHTML`. An exception needs approval, sanitising and a reason on the line. [lint]
