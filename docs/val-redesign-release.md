# VAL redesign release checklist

## Scope and source mapping

- Dashboard reference: condensed welcome header, black navigation, off-white request panels, orange actions, photographic space cards, and a desktop lunar side rail. Implemented in `dashboard-shell`, `dashboard-sidebar`, `val-page-hero`, and `val-design.css`.
- Locked voice reference (Image 10): narrow global rail and channel sidebar, room header, dominant speaker stage, participants and connection panels, real audio activity, and grouped controls. Implemented in `call-workspace`, `use-call-activity`, and the persistent call provider.
- Existing friends, messages, profile, text channel, and notification flows retain their routes and authorization. Shared authenticated styles and relevant list/header components carry the visual system.
- Mobile research: safe-area spacing, visual viewport sizing, comfortable touch targets, bounded scrolling, collapsible supporting panels, and secondary call controls. Native device keyboard and audio behavior still require physical-device checks.
- Echo Sonar geometry is preserved. The lunar landscape is an authorized generated approximation; see `public/brand/README.md`.

## Functionality

- Remote audio belongs to the persistent session so navigation and active-speaker changes do not recreate playback.
- Microphone, camera, screen sharing, deafen, leave, pop-out, music, and existing audio settings remain accessible.
- Audio activity uses actual tracks and a throttled analyser; no fabricated network measurements or random activity.
- Permission errors are visible. Signaling failure exposes reconnect. Late capture after leaving is stopped.
- Signaling carries track source metadata so remote shared screens use the legible screen layout.
- No schema, authentication, membership, or permission changes.

## Automated validation

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run test:media`: 4 passed, 0 failed. Tests cancellation, mute and cleanup, signaling failure/recovery, and remote screen metadata using isolated media boundaries.
- `npm run build`: passed. Explicit display-font fallback resolves the earlier automatic fallback warning.
- `npm audit --audit-level=moderate`: passed, zero vulnerabilities.
- `git diff --check`: passed.
- GitHub CI now runs the media tests in addition to existing lint, audit, and build. Security workflows and branch protections remain enabled.

## Release gates

- [ ] Final authenticated visual QA at 1440/1920, 768/1024, and 360/390/430 pixels plus short landscape.
- [ ] Actual call control transitions, keyboard focus, pop-out/navigation continuity, and notification/settings overlays.
- [ ] GitHub required checks on the final revision: CI, Trivy, Gitleaks.
- [ ] Merge under existing main-branch protection.
- [ ] Vercel production deployment matches the merged commit.
- [ ] Production routes, assets, font loading, and runtime smoke test.

The browser extension disconnected during final QA on September 26. Earlier partial desktop inspection is not final acceptance. Multi-user media and physical mobile-device testing have not been performed. Usage-limit tooling is unavailable; no remaining allowance is claimed.

GitHub code-scanning API returned no open alerts at preparation time. Dependabot alerts are disabled for this repository. The separate secret-scanning API is inaccessible with the CLI token's current scope; the required Gitleaks workflow remains the release check for committed secrets.
