# Dependency audit exception

The full npm audit still runs in CI. All production moderate-or-higher findings fail the check. One temporary development-only exception was reassessed on **2026-10-22** and is tracked through **2026-10-29**, after which CI fails until it is removed or explicitly reassessed.

## GHSA-vfj7-8cjw-p6xm

- Affected package: `braces@3.0.3`, reached through `micromatch` → `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next`.
- The [upstream advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) reports stack exhaustion from deeply nested glob patterns and still has no patched release as of the 2026-10-22 reassessment. The npm registry's latest release remains 3.0.3.
- Every accepted package must be marked `dev: true` in the checked-in lockfile. A separate production audit denies all exceptions.
- VAL's ESLint configuration uses the repository's working directory and does not configure `settings.next.rootDir` with externally supplied glob patterns. In the installed plugin, `dist/utils/get-root-dirs.js` invokes `fast-glob` only for that optional setting. This finding does not describe a reachable application request path in VAL.
- The check accepts only this exact high-severity advisory, this exact braces version, and the named linter dependency chain. New advisories, production copies, missing lockfile classifications, severity changes, and expiry fail CI.
- The exception and the full finding counts remain visible in CI output. Dependency scanning and secret scanning are unchanged.

The 2026-10-22 review retains the exact advisory, version, development classification and dependency-chain limits. The linter receives repository-controlled configuration; application users cannot supply its glob patterns. The unrelated runtime findings in Next.js 16.3.8 are resolved by upgrading Next.js and its matching lint configuration to 16.4.2 and are never covered by this exception.

Remove this exception and its validator branch when the linter dependency receives a patched package. Do not downgrade VAL's Next.js 16 lint configuration to the unrelated Next.js 14 suggestion from npm audit.
