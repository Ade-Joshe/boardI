# Security policy

## Reporting a vulnerability

**Please don't open a public issue.** Report it privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**.

Include:

- what the issue is and where it is (URL, file or endpoint)
- steps to reproduce it, or a proof of concept
- the impact you think it has
- the commit or deployment you tested against

## What to expect

- We acknowledge your report within **3 business days**.
- We give you an initial assessment within **10 business days**.
- We'll keep you updated until it's fixed. Critical issues are prioritised over all other work.
- If you'd like, we'll credit you once a fix ships.

## Supported versions

Only the latest commit on `main` and the current production deployment receive security fixes.

## Scope

**In scope:** this repository's code, its build and deployment configuration, and the running application.

**Out of scope:**

- Vulnerabilities in third-party dependencies with no demonstrated impact here. Report those upstream.
- Volumetric denial of service.
- Social engineering.
- Reports from automated scanners without a working exploit.

## Safe harbour

We won't pursue legal action over good-faith research that:

- avoids privacy violations, data destruction and service disruption
- accesses only the data needed to show the issue
- gives us reasonable time to fix it before disclosure

For how the project is secured, see [docs/security-model.md](docs/security-model.md).
