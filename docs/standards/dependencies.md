---
paths:
  - "package.json"
  - "pnpm-workspace.yaml"
  - "pnpm-lock.yaml"
---

# Dependencies

- Ask before adding one. Prefer the platform or an existing dependency. [agent permission]
- Check it exists on npm, has the name you meant (not a look-alike) and is maintained. [minimumReleaseAge, trustPolicy, review]
- Pin exact versions. [savePrefix]
- Never loosen the supply-chain settings in `pnpm-workspace.yaml`, or add to `allowBuilds`. [review]
- No high or critical advisories in runtime deps. [audit, dependency review]
