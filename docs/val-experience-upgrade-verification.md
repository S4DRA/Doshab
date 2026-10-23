# VAL experience upgrade: audit and verification

Date: 2026-10-23. Research authority: the supplied October 2026 experience research and Adaptive Navigation master task. Baseline source: `9fc3a9b47edde796f4d1866669236f80b9ca5dd6` on GitHub main.

## Result

Implemented the adaptive navigation/resource foundation in the existing product, plus a companion Windows 0.1.7 startup-update candidate. Preserve approved branding and composition. No application dependency, database schema, authentication policy, codec or capture permission was changed.

This is a verified incremental upgrade, **not completion of all ten original steps**. Physical-device coverage, controlled gaming benchmarks, a 60-minute soak, the two-version Windows installer/update exercise, and comparative desktop-container benchmarks remain outstanding. Read the limitations before interpreting the numbers below.

## Repository and architecture findings

The existing development checkout at `D:\Exairon Github\Doshab` is on `codex/mobile-nav-dm-fit` at `f1e5860`, with a pre-existing documentation edit and untracked QA material. It predates the current Windows release. That checkout's tracked application source was not rewritten. Work was implemented in an isolated clone of current main to preserve the existing edit and avoid building on an obsolete desktop strategy.

Inventory at the current-main baseline: 236 TypeScript/TSX source modules, 73 client modules, 21 page files, 53 API route handlers, 21 Prisma models, 11 web test files, and a separate desktop test suite. The inventory excludes generated Prisma code/dependencies. The review covered routing, authenticated server reads, client boundaries, navigation, chat, persistent calls, voice settings, music, preferences, native source, tests and deployment configuration; it is not a formal line-by-line security certification.

| Area | Actual architecture and boundary |
| --- | --- |
| Web | Next 16.4.2 App Router, React 19.2.4, strict TypeScript, Tailwind 4 and existing scoped custom styles. Server components query application data; client components own interaction. |
| State | React context/local state, existing external stores for memory-only drafts/sends, React request caching for dashboard reads. No Redux/query-cache dependency is present. |
| Auth | Supabase Auth with an active legacy signed-session path. Current main uses 30-day JWT/session persistence, not the older checkout's 8-hour implementation. API membership/role checks remain server-side. |
| Data | Prisma 7.10.0 with the PostgreSQL adapter. No schema or migration was added. Existing migrations were applied only to a new isolated local QA database. |
| Chat | Encrypted message envelopes, browser device keys, a native EventSource feed, a process-local message bus and a 30-second database catch-up poll. Initial conversation history is limited to 50 messages. |
| Calling | A persistent dashboard-level provider owns native WebRTC tracks/audio; Supabase Realtime carries signaling/presence. Peer mesh, optional configured TURN, group voice, friend-call invitations, camera and screen audio/video already exist. No active SFU/mediasoup server was found. |
| Music | Separate existing session polling and a YouTube player; no change to its authority, queue or audio transport. |
| Navigation | Existing desktop rails and dedicated mobile compositions/sheets. Native browser history remains authoritative. Existing focused push-to-talk and Escape/Tab handling are retained; Ctrl/Cmd+K opens existing search outside editors/dialogs. |
| Appearance | Existing supplied Echo Sonar artwork, palette/mode settings, image adjustment and native controls. Resting geometry is retained; the new comfort controls are opt-in. |
| Windows | Electron 43.8.3 with sandbox/context isolation, tray behavior, user-consented screen selection, persistent login, `electron-updater` 6.8.9 and a custom NSIS/WPF installer already existed on main. |
| Deployment | Vercel builds the web app. Protected main requires Lint/Audit/Build, filesystem/dependency scan and Gitleaks. A separate Windows workflow builds native artifacts and publishes new main/tag desktop versions. |

Important existing routes: public `/`, login/register/recovery/callback, `/download`, `/download/windows`; dashboard home, spaces, friends, messages, search, notifications, profile/settings, group overview/settings, shared text/voice channel routes, and friend-call rooms. Production hides the development media diagnostic. No replacement route hierarchy or runtime maze graph was introduced.

## Findings addressed

| Finding and evidence | Change |
| --- | --- |
| Desktop chat mount issued 17 speculative requests; mobile issued 11. Whole-sidebar and whole-channel timers plus automatic Link preparation were active. | Remove blanket loops. Reuse Next through one intent-controlled link adapter, with one outstanding destination, one timer and four preparations/minute. No speculative work while hidden/offline, reduced-data/slow-network reporting, active calls or Game-Safe Mode. |
| Server rendering could repair missing owner membership or create an application account. | Recognize framework prefetch headers and suppress those writes on speculative requests. Keep normal authorized navigation behavior. |
| Each message-list render constructed a new report callback for every row. | Pass the stable state dispatcher; bind the selected message only when the report action occurs. |
| Concurrent initial decrypt/register calls could generate multiple device identities. | Single-flight device identity generation; preserve the existing key and envelope formats. |
| Rapid conversation switching re-registered one device on every mount and reached the existing 30/minute endpoint limit. | Coalesce registration; reuse a recent success for the same account/device for 60 seconds; re-register on account change/expiry; do not cache failures. Bound the network request to 10 seconds. |
| Device registration ignored HTTP failures and could announce readiness anyway. | Check the response and show the existing retry/error state. |
| Conversation return lost reading position although drafts already survived. | Retain at most 80 in-memory positions/anchors, latest known message and following state per signed-in provider; restore against authorized current data. Keep existing drafts/sends. |
| Call visualization requested an animation frame continuously while sampling at roughly 100 ms. | Use one sampler at 100 ms; 250 ms without FFT drawing in Game-Safe; no scheduled sampler while hidden. Never stop call tracks. This is a scheduling change, not a measured OS CPU/FPS claim. |
| Call connection diagnostics lacked actual quality counters. | Add user-requested aggregate WebRTC statistics and distinguish peer reconnection. Missing measurements remain unavailable; no IP/track/device identifiers are exported. |
| Manual/OS reduced-motion handling did not cover every explicit smooth chat scroll. | Respect the live preference for reply/search/jump-to-latest scrolling and expose local reduced motion/comfort preferences. |
| Axe found small grouped-message timestamps at 4.13:1 contrast on the inspected surface. | Use the existing stronger muted-text token for that element. Final inspected chat scan has no violations. |
| Desktop opened immediately and checked for updates later. | Companion 0.1.7 candidate restores inactivity/session state, gates platform loading on the startup check/download/install, offers Retry/Quit and guards tray reload/navigation bypasses. Active sessions retain non-forced background updates. |
| The download click could use stale display metadata or accept a partial native release. | Resolve current metadata on click and require the installer, blockmap and latest.yml to be complete/stable from the existing repository. Publish new native releases through a draft before exposing them. |

## Benchmark conditions and results

Local Windows `10.0.26340`, Intel i7-13620H, 16 logical CPUs, 15.7 GiB RAM, Node 24.21.0. Headless Chromium at 1440×900 and 390×844; production Next build, separate loopback PostgreSQL 18 cluster on port 65524. Two synthetic QA accounts, one real-schema QA space, two text channels, one voice channel and 70 seeded legacy history rows/channel; tests also created actual encrypted messages. These fixtures and session files stayed outside the repository. No production database/account was used.

Real media tests used unique ephemeral rooms on the existing public signaling provider, with synthetic tracks/QA identities. They did not create application users/invitations or send notifications to other people. Browser call tests used fake microphone/camera devices, not a recording of the user's room.

| Repeatable observation | Baseline | Upgraded result |
| --- | --- | --- |
| Speculative requests during desktop chat mount, after 1.8 s | 17 | 0 |
| Speculative requests during mobile chat mount, after 1.8 s | 11 | 0 |
| Sustained hover | Blanket preparation was already active | 1 destination; no POST and no user/membership/call/notification row-count changes |
| Rapid switching and device registration | Repeated registration reached 30/minute and disabled preparation | 30 switches/context completed with 1 registration; tested at normal and 4× CPU slowdown |
| Next route commit, 30 switches, normal CPU | Not instrumented with this metric | mean 24.4 ms, p50 24.0 ms, p95 26.2 ms |
| Next route commit, 30 switches, 4× CPU slowdown | Not instrumented with this metric | mean 98.3 ms, p50 95.1 ms, p95 114.7 ms |
| Reading position on Back | Reset on remount | Restored to the requested 150 px with anchor/offset preservation |
| Activity sampling policy | Frame-driven, drawing branch every ~100 ms | One 100 ms sampler; 250 ms and no FFT in Game-Safe; no sampler while hidden |
| Inspected chat accessibility scan | Contrast failure on grouped timestamps | No violations in the tested WCAG A/AA tags/surface |

Route-commit timing begins at Next `onNavigate` and ends at the provider's committed pathname/query effect. It **excludes subsequent message decryption** and is not field INP or a certified end-to-end cached-conversation SLA. The early eight-switch Playwright driver loop was noisy (including a >400 ms sample); do not substitute those driver timings for input-to-paint. Neither an FPS improvement nor a memory-leak result is claimed.

Next's internal cache-hit ratio is not exposed through the current API. The new diagnostics honestly report preparation/visit/invalidation counters rather than fabricate a cache-hit percentage. No second decrypted-message cache was added.

## Validation performed

| Command/check | Result |
| --- | --- |
| `node --test tests/*.test.mjs` | 138 passed; 0 failed/skipped |
| `node --test desktop/tests/*.test.cjs` | 45 passed; 0 failed/skipped on the companion candidate |
| Combined web/desktop unit run | 183 passed |
| `npm run lint` | Passed; no errors/warnings |
| `npx tsc --noEmit --incremental false` | Passed |
| `npm run build` | Passed with Prisma client generation and production route compilation; no production migration |
| `npm run audit:dependencies` | Passed; registry report had zero vulnerabilities at measurement time |
| Browser desktop/mobile checks | Passed route switching, Back/Forward, saved draft/scroll, channel-sheet history, Ctrl/Cmd+K, offline return, opt-in setting persistence and account isolation, logout draft clearing |
| Two-account encrypted messaging | Recipient decrypted the sent text; stored message was an encrypted envelope rather than that plaintext |
| Speculative side-effect check | Hover caused no POST or changes to tested user/membership/call/notification counts |
| Real native WebRTC/RTP integration | Passed independent clients, bidirectional decoded audio, concurrent camera/screen video, screen audio, stop/restart/mute, departure cleanup and late join/rejoin; no signaling warnings |
| Browser call integration | Passed real peer audio tracks, navigation preserving the persistent call, actual quality diagnostics and Game-Safe preserving active audio during the sample |
| `npm run dist` in desktop candidate | Built Windows x64 installer, blockmap and latest.yml; existing native setup self-test passed all 16 assertions |
| Packaged ASAR/checksum review | Packaged main/updater/preload/startup HTML match reviewed source; manifest version is 0.1.7; installer SHA-512 matches latest.yml |
| `git diff --check` | Passed |

Earlier test failures were investigated: an existing native test's arbitrary event-loop wait depended on filesystem timing (the harness now provides deterministic actual-file loading); a local seed timestamp conversion placed QA history three hours in the future (fixed only in the isolated fixture); a cookie-only account swap did not navigate the browser through actual logout (the final test uses the real logout form). The rapid device-registration limit was an application issue and was fixed. Final successful runs are the authority, without erasing these limitations.

## Remaining limitations and acceptance gates

1. No controlled game scene, GPU frame-time/1% low capture or 60-minute soak has been run. The research's ≤2% average-FPS / ≤5% 1%-low goals are aspirations until tested on named machines/scenes.
2. No physical iOS/Android/Safari/touch keyboard or human screen-reader session was available. Desktop/mobile Chromium checks and CPU throttling do not substitute for those devices. Actual Windows capture/system-audio/device switching needs physical validation.
3. The 0.1.7 native candidate has not been installed through a two-version upgrade in a clean Windows test machine. Do not treat a built installer or mocked updater contract as proof of successful real replacement/relaunch. Keep native rollout separate until that exercise passes.
4. Earlier installed clients cannot execute new startup behavior before they receive the seed. Existing update-enabled clients get it through their current update-on-full-quit path; pre-updater clients need an installer once.
5. Focused push-to-talk remains focused-only; there is no invasive global keyboard/game hook. PWA/Tauri/WebView2/Electron have not been compared in equivalent runtime benchmarks, so there is no claim that one is fastest.
6. Current chat still has initial-50 history and session-long live-message retention; no new history backend or variable-height virtualization was invented. Timestamp-only SSE catch-up, cross-instance latency, long histories and long-session retention need separate load/consistency verification. The new positions/duration counters themselves are bounded.
7. Existing auth verification flags/fallbacks, notification-preview retention, serverless upload durability and TURN/deployment configuration were inspected as existing boundaries, not silently redesigned or certified. Local success is not proof of deployed configuration or cross-NAT reliability.

## Program status

| Master phase | Status | Evidence/scope |
| --- | --- | --- |
| A Inspect | COMPLETE | Current-main inventory, focused subsystem audit, reproducible local baseline and explicit limitations |
| B Research/decisions | COMPLETE | All six requested principles evaluated; simple bounded preparation, incremental reuse and offline BFS selected |
| C Performance foundation | COMPLETE | Blanket work removed, stable row callbacks, coalesced identity/registration, bounded sampler; tests and measured request reduction |
| D Adaptive navigation | COMPLETE | Existing routes/history, intent adapter, bounded scheduler, position/draft preservation, keyboard/mobile checks |
| E UX/motion | COMPLETE for this increment | Existing visual identity retained; opt-in comfort/density/motion and targeted contrast correction; no wholesale design migration |
| F Communication protection | COMPLETE for tested scenarios | Encrypted two-account messaging, real synthetic RTP, browser route/call/Game-Safe checks; physical quality/capture is unverified |
| G Game-Safe integration | COMPLETE functionally | Opt-in speculation/effect/analysis rules; essential media preserved; no FPS benefit claimed |
| H Full validation/release | PARTIAL | Automated/lab checks and native package pass; native two-version, hardware/gaming/long-soak gates remain |

Original ten-step status: 1–3 implemented/verified for this increment; 4–6 targeted refinements implemented, broader visual/history work remains controlled future iteration; 7–8 verified for the stated synthetic/lab scenarios; 9 has an existing Electron strategy and tested candidate but lacks cross-container/physical benchmarks; 10 remains partial. The complete ten-step program must not be marked finished.
