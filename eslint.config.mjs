import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Rules here enforce docs/standards/; keep the two in sync.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      // Raw HTML skips React's escaping. If unavoidable: sanitise,
      // then disable per line with a reason.
      "react/no-danger": "error",
      "react/jsx-no-target-blank": ["error", { allowReferrer: false }],
      // Production CSP blocks inline style attributes; use Tailwind classes.
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message:
                "Prod CSP blocks inline styles (dev allows them). Use a Tailwind class.",
            },
          ],
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "import/no-default-export": "error",
    },
  },
  {
    // Next.js and tool configs require default exports here.
    files: [
      "src/app/**/{page,layout,loading,error,not-found,global-error,template,default,forbidden,unauthorized}.tsx",
      "src/app/**/{opengraph-image,twitter-image,icon,apple-icon,sitemap,robots,manifest}.{ts,tsx}",
      "**/*.config.{ts,mjs,js}",
    ],
    rules: { "import/no-default-export": "off" },
  },
  {
    // Server by default: "use client" belongs on leaf components.
    files: ["src/app/**/{page,layout}.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > ExpressionStatement[directive='use client']",
          message:
            "Pages and layouts stay Server Components. Move interactivity into a leaf component.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
