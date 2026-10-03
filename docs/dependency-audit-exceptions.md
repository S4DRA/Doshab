# Dependency audit exception

The full npm audit still runs in CI. All production moderate-or-higher findings fail the check. One temporary development-only exception is tracked through **2026-10-17**, after which CI fails until it is removed or explicitly reassessed.

## GHSA-vfj7-8cjw-p6xm

- Affected package: `braces@3.0.3`, reached through `micromatch` → `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next`.
- The [upstream advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) reports stack exhaustion from deeply nested glob patterns and has no patched release as of 2026-10-03.
- Every accepted package must be marked `dev: true` in the checked-in lockfile. A separate production audit denies all exceptions.
- VAL's ESLint configuration uses the repository's working directory and does not configure `settings.next.rootDir` with externally supplied glob patterns. In the installed plugin, `dist/utils/get-root-dirs.js` invokes `fast-glob` only for that optional setting. This finding does not describe a reachable application request path in VAL.
- The check accepts only this exact high-severity advisory, this exact braces version, and the named linter dependency chain. New advisories, production copies, missing lockfile classifications, severity changes, and expiry fail CI.
- The exception and the full finding counts remain visible in CI output. Dependency scanning and secret scanning are unchanged.

Remove this exception and its validator branch when the linter dependency receives a patched package. Do not downgrade VAL's Next.js 16 lint configuration to the unrelated Next.js 14 suggestion from npm audit.
