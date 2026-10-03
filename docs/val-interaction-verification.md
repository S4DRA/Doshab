# VAL interaction verification

## Scope

- Contextual people rail in the existing desktop footprint: members on space, text-channel, and space-settings pages; friends on overview, messaging, friend, and account pages. Voice rooms retain their existing participant surface.
- Local name/email search, status filter, paginated display (20 people initially), member disclosures, profile navigation, accepted-friend message/call actions, and a review step before adding other members as friends.
- Existing sidebar refresh updates the friends rail; no additional polling or status service. Status labels reflect saved user availability.
- Inline navigation feedback, focus/pressed/hover states, duplicate-submit prevention, recoverable call-start errors, and reduced-motion support.
- Lightweight loading panel using the supplied VAL logo and one transform animation. Theme selection is removed; old theme-gallery URLs redirect to account settings and stored theme overrides no longer change the document.

## Automated verification (2026-10-03)

- ESLint, TypeScript, media lifecycle suite (15 tests), and optimized Next.js production build passed.
- Local HTTP checks passed for public pages, protected dashboard routes, manifest, stylesheet/font requests, and unchanged brand asset hashes.
- Local read-only database check confirmed complete member profiles for the space-settings selection. No migration or database writes were needed.
- Production dependency audit reports zero vulnerabilities after updating Next.js and its ESLint configuration to 16.3.8.
- Full dependency audit reports five high-severity entries tracing to the development-only `braces@3.0.3` dependency under `eslint-config-next`. The upstream advisory has no patched release: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm. The exact development-only chain has a documented exception through 2026-10-17; production findings and all other advisories still fail. Six audit-guard tests pass. See `dependency-audit-exceptions.md`.

## Browser verification pending

The browser extension is disconnected. These checks are not covered by compilation or HTTP checks:

- At the existing rail breakpoint (1400px and above), verify friends on overview pages and the current space members on text/settings pages. Check long names, scrolling, empty results, keyboard focus and disclosure actions.
- At tablet/mobile sizes, verify the existing navigation and member drawer remain usable without an extra rail or horizontal overflow.
- Inspect the route/loading fallback and verify it clears when navigation completes, including reduced-motion behavior.
- Verify message/call success and failure through authorized test accounts; avoid notifying unrelated users.
- Complete the two-account camera, screen-share, and audio checks documented in `val-call-verification.md`. Preview requires its server-side `MEDIA_AUTH_SECRET`; production already has its own configuration.

No physical-device, production browser, or frame-rate/performance profiling result is claimed here.
