# Music and mobile Settings repair

## Findings

Production room music returned HTTP 503 while YouTube search worked. Vercel's runtime log showed `public.music_sessions` missing. A read-only schema check confirmed the missing table. Eleven migrations were recorded; three existing repository migrations had not been applied. Their recorded predecessors matched the local migration checksums.

Mobile Profile opened Settings through a server navigation despite already having the authenticated user and all Settings components. The link had no pending indicator. Room music also mounted no player for listeners until they opened it themselves, checked idle rooms only every 15 seconds, and restricted transport and queue management to the original DJ.

## Changes

- Mobile Settings and Edit profile use Next's supported native History API for their existing local views. URLs, direct links and Back/Forward remain supported. Opening either view no longer repeats authentication/database work. Desktop composition is unchanged.
- Visible rooms check music state every three seconds, including the first song. A playing room opens a visible mini-player for its listeners without taking keyboard focus. A paused song keeps that player mounted. Explicit Close stays respected while the user remains in that room; it stops only local playback.
- Authorized space members can control playback and the queue. The starter fields remain attribution and no longer reserve playback permissions. Local volume, mute and Close remain personal. The server still checks authentication, voice-channel type and space membership; it does not claim authoritative server verification of active voice presence.
- Music writes now compare the saved version atomically. Concurrent changes return a recoverable 409 instead of overwriting another member's queue. Acknowledged command retries remain idempotent even when their original version is stale.
- Added nine music regression tests and the corresponding CI step.

## Production database repair

Applied the existing `add_user_voice_settings`, `add_security_rate_limits_and_audit_logs` and `add_music_sessions` migrations using a temporary production Prisma configuration pointed at this project's session pooler. A direct IPv6 connection was unavailable from this workstation. Environment files and credentials were not changed or committed.

Added and applied `20261005003000_secure_server_only_tables`: RLS is enabled for those four tables, PUBLIC privileges are revoked, and the Supabase browser roles lose direct CRUD privileges when those roles exist. The server's existing database role is preserved. No user records were removed or rewritten, and the Prisma model schema did not change.

Verification: all four tables exist with RLS enabled; all 32 browser-role/table/operation privilege checks deny access. Actual SELECT attempts as both `anon` and `authenticated` fail with permission denied, while the server role reads music state successfully. The production player recovers from its error and enables song selection.

Supabase Security Advisor was rerun: zero errors and three pre-existing warnings (two about `public.rls_auto_enable()` execution and one about leaked-password protection). Those unrelated settings were preserved.

Future releases containing migrations must check the production migration ledger as well as the app build. This repository's local Prisma configuration deliberately prefers `.env.local`; production checks must use an explicitly selected production configuration.

## Verification and evidence

| Check | Result |
| --- | --- |
| `npm run lint` | Passed, exit 0 |
| `npx tsc --noEmit` | Passed, exit 0 |
| `npm run build` | Passed, exit 0; compile 4.1s, TypeScript 9.0s, 47 static pages |
| Mobile, chat, media, audit-policy and music unit suites | 61 passed, 0 failed, 0 skipped |
| `git diff --check` | Passed; Windows line-ending notices only |
| Local migration deploy | Passed |
| Production migration deploy and schema/access checks | Passed |
| Mobile Settings at 360/375/390/412/430px | Visible at the check 250ms after clicking; zero server requests on opening, despite a forced five-second server delay; Back, settings-category history and direct reload pass |
| Two isolated local browsers at 390px | Real YouTube video advances in both; listener auto-opens, pauses room music, stays mounted on Pause, respects Close, reopens and persists across dashboard navigation |

The local room has one existing member, so the two-browser check uses the same account in separate browser contexts. It proves cross-browser synchronization and actual provider playback, not two-account audibility. Distinct-member authorization and concurrent command behavior are covered with server dependency test doubles. The original local paused song and position were restored after browser checks.

Local screenshots and measured results are saved under `.codex-temp/mobile-visual-runner/music-settings/`: `after-settings-{width}.png`, `after-music-390.png`, `after-playback-390.png`, `after-listener-390.png`, `after.json` and `production-music-available.jpg`. These evidence files stay outside the application commit.

## Files changed

- Profile navigation: `app/dashboard/profile/page.tsx`, `components/mobile/mobile-profile.tsx`, `components/mobile/mobile-ui.tsx`.
- Music: `components/music/music-session-provider.tsx`, `components/music/listen-together-popover.tsx`, `components/music/music-player.tsx`, `lib/music/state.ts`, `lib/music/server.ts`.
- Database protection: `prisma/migrations/20261005003000_secure_server_only_tables/migration.sql`.
- Regression checks: `tests/music-session.test.mjs`, `package.json`, `.github/workflows/ci.yml`.
- This report.

## YouTube account connection and remaining verification

Public music uses the official YouTube embedded player and does not require YouTube sign-in. Each listener plays through their own visible player; browser autoplay restrictions may require tapping Join. [YouTube player documentation](https://developers.google.com/youtube/iframe_api_reference).

The repository has no Google OAuth client configuration or personal-playlist connection. Connecting personal YouTube playlists requires a Google OAuth client and user consent; one person's login or Premium entitlement cannot be distributed to other room members. No fake Connect button, password collector or hidden audio extraction was added. [YouTube authentication](https://developers.google.com/youtube/v3/guides/authentication), [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies).

Personal account/playlist integration remains pending clarification and OAuth project configuration. Physical-phone audibility, installed-PWA interruptions and two-account production playback are not established by the local emulation results above. Release and production browser results will be recorded after the app checks finish.
