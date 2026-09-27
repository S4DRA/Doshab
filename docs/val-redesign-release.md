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
- `npm run test:media`: 5 passed, 0 failed. Tests cancellation, mute and cleanup, signaling failure/recovery, remote screen start/stop metadata, and cleanup during signaling failure using isolated media boundaries.
- `npm run build`: passed. Explicit display-font fallback resolves the earlier automatic fallback warning.
- `npm audit --audit-level=moderate`: passed, zero vulnerabilities.
- `git diff --check`: passed.
- GitHub CI now runs the media tests in addition to existing lint, audit, and build. Security workflows and branch protections remain enabled.

## Browser verification

Performed against the existing authenticated local account and its existing demo space on September 26, without adding sample users or groups:

| Check | Result |
| --- | --- |
| Voice: 1440x900 and 1920x1080 | Header, speaker stage, support column, lunar imagery, controls inspected against Image 10 |
| Voice: 768x1024 and 1024x768 | No page-width overflow; secondary actions use the More sheet |
| Voice: 360x800, 390x844, 430x932 | Mic and Leave remain visible above navigation; participant/details sections remain accessible |
| Voice: 844x390 landscape | Sticky controls remain reachable; supporting panels can scroll |
| Real local call | Signaling connected, microphone mute and activity, camera start/stop, and deafen state verified |
| Persistence | Pop-out, Messages navigation, return, audio-settings navigation, and leaving verified |
| Secondary controls | More sheet opens and closes with Escape; channel drawer opens and closes |
| Other surfaces | Desktop home/text channel and mobile friends/messages/profile inspected; friend search/filter and quick-actions opening exercised |

Visual fixes from this pass include mobile header contrast, avatar contrast, the quick-action icon mask, tablet control spacing, and desktop space labels. The final mobile quick-actions wiring also exposes the existing notification and profile menus, which were previously hidden with the desktop sidebar. Its browser retest and the final audio-settings scroll adjustment are pending browser reconnection.

## Release tracking and limits

[PR #30](https://github.com/S4DRA/Doshab/pull/30) tracks the latest revision, required CI/Trivy/Gitleaks results, and deployment status. The production target is the existing Vercel `doshab` project at `https://doshab.vercel.app`; publication uses protected `main` with no bypass.

The browser reconnected for the checks above, then disconnected again on September 27. Multi-user audio/video, an actual screen-capture picker flow, real network interruption, physical mobile keyboards/safe areas, and text enlargement have not been verified. Signaling failures and remote screen metadata are covered by isolated tests, not a claim of end-to-end multi-user coverage. Usage-limit tooling is unavailable; no remaining allowance is claimed.

GitHub code-scanning API returned no open alerts at preparation time. Dependabot alerts are disabled for this repository. The separate secret-scanning API is inaccessible with the CLI token's current scope; the required Gitleaks workflow remains the release check for committed secrets.
