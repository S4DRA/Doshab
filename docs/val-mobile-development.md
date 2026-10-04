# VAL mobile development report

Updated: 2026-10-04. Branch: `codex/val-mobile-app-experience`.

Changes are local and uncommitted. Nothing was pushed or deployed. The mobile visual inspection now has saved five-width evidence and a [comparison report/gallery](val-mobile-visual-comparison.md). Physical-device and populated-account QA remain open; this is still development work.

The implementation follows the supplied VAL Mobile UX Research Plan, both pasted requests, the ten mobile references, and the existing VAL assets and functionality. Reference content and fictional counts were not imported as app data.

## 1. What changed and what the audit found

The old mobile experience depended on desktop navigation and densely packed page layouts. Existing authenticated routes, encrypted messaging, friendship gates, group permissions, and call transport could be reused. Public discovery, message attachments, and several native capabilities had no existing implementation to connect to.

Mobile now has a separate composition with four default destinations, compact social content, readable conversation layouts, channel and action sheets, contextual settings, and persistent communication controls. Home uses real recent conversations, joined spaces, online friends, requests, invitations, and a voice-room shortcut. Desktop rail styling and approved logo geometry were preserved.

Explicit follow-up requests add up/down ordering for Home's conversation, spaces, friends and requests sections. Use the 48px drag handles; keyboard users can pick up with Space, move with arrows, drop with Space or cancel with Escape. Handles reserve the drag gesture while ordinary content still scrolls. Previews stay inside the visible section area, edges auto-scroll, and order is saved as section IDs only in account-scoped device storage. The welcome/actions/voice context retains its place. Storage failures show a visible warning.

Mobile page switching uses a 150ms loading threshold. Existing VAL loading artwork appears for pending navbar requests and dashboard/channel route fallbacks; fast completion cancels the timer, with no artificial navigation delay or minimum loader display time. Desktop loading remains unchanged. Space-card logo/member fallback tiles use the same dark neutral avatar palette as voice context, fixing the blue tiles identified in the supplied localhost screenshot.

The latest explicit request adds customization only in **Profile → Settings → Navigation bar**. Users can add/remove Home, Spaces, Messages, Profile, Friends, Search, Notifications and Create; choose bottom, top, left or right; and enable floating only at the bottom. The default remains the approved four buttons. Choices are validated and saved per account on this device, with visible storage errors and a Restore default action. An empty selection hides the bar. If Profile is removed, a header Settings shortcut keeps the editor reachable, including inside conversations. No account setting is sent to the server.

Page frames reserve the selected bar's width/height, floating gap and safe areas. Side layouts reflow Home sections instead of squeezing cards. The settings position picker stacks when its columns would become too narrow, keeping each label intact. Crowded horizontal/vertical bars scroll while preserving targets. Loading and call/music surfaces follow the same geometry; keyboard entry hides the bar and releases its reservations. Friends has a dedicated handshake icon in the navbar, picker and Profile connections, distinct from the Profile silhouette.

Integration review also found that the existing music provider was not mounted. It now shares the persistent dashboard lifetime with the call. Idle music sessions check for another participant starting music every 15 seconds while visible; active tracks refresh every 3 seconds. Requests are coalesced and timers are removed when leaving the session.

## 2. Mobile architecture

- `MobileShell` supplies the top bar, offline notice, and the default Home / Spaces / Messages / Profile navigation. `MobileNavbarPreferencesProvider` shares account-scoped device preferences with the Settings-only editor. Existing routes can be added to the navbar. Search also remains reachable from Profile's connections list. Spaces uses stacked layers, Friends a handshake, and Profile the account photo or normal fallback icon.
- Mobile layouts activate through one shared media-query contract. Existing desktop compositions remain in place.
- `DialogSurface` portals sheets above page content, contains keyboard focus, restores the trigger, and integrates mobile Back with sheet closure. Sheet-to-sheet transitions reuse the history entry.
- `MessageDraftsProvider` retains drafts during dashboard navigation. Its bounded in-memory store is isolated by account and channel; plaintext drafts are not written to disk.
- `PersistentCallProvider` continues to own media and remote audio. A single music provider/player lives beside it rather than being recreated by each route.
- Authenticated server pages provide actual membership-scoped data. Interactive search, filtering, sheets, drafts, and media controls remain client components.

## 3. Components created or refactored / files changed

New presentation and navigation:

- `components/mobile/mobile-ui.tsx`, `mobile-shell.tsx`, `mobile-home.tsx`, `mobile-groups.tsx`, `mobile-space.tsx`, `mobile-friends.tsx`, `mobile-search.tsx`, `mobile-notifications.tsx`, `mobile-create-space.tsx`, `mobile-profile.tsx`.
- `app/dashboard/mobile.css` and `lib/mobile-navigation.ts`.
- `components/mobile/mobile-home-sections.tsx`, `lib/mobile-home-order.ts` and `components/mobile/mobile-page-loading.tsx` implement the later requested ordering/loading behavior.
- `components/mobile/mobile-navbar-preferences.tsx`, `mobile-navbar-settings.tsx` and `lib/mobile-navbar.ts` implement the requested Settings-only navbar customization.

New communication support:

- `components/chat/message-drafts-provider.tsx`, `lib/message-drafts.ts`.
- `components/calls/mobile-call-controls.tsx`, `components/calls/use-call-wake-lock.ts`.

Existing files integrated or refactored:

- `app/dashboard/layout.tsx`, `page.tsx`, `channels/page.tsx`, `friends/page.tsx`, `profile/page.tsx`.
- `components/layout/dashboard-shell.tsx`.
- `components/chat/channel-header-actions.tsx`, `message-list.tsx`, `realtime-message-panel.tsx`.
- `components/messages/messages-page-client.tsx` and `components/ui/dialog-surface.tsx`.
- `components/calls/call-workspace.tsx`, `persistent-call-provider.tsx`.
- `components/music/music-session-provider.tsx`, `music-button.tsx`, `listen-together-popover.tsx`.
- `components/profile/profile-settings-panel.tsx`, `components/onboarding/dashboard-onboarding-coordinator.tsx`.
- `app/layout.tsx` adds Latin Extended font subsets; `app/manifest.ts` adds shortcuts.
- `public/push-sw.js`, new `public/offline.html`, `package.json`, new `tests/mobile-experience.test.mjs`, and this report.

No dependency, lockfile, schema, migration, approved brand image, or desktop sidebar styling changes were introduced. Existing untracked temporary files and the unapproved light-logo asset were left alone.

## 4. Routes and screens

| Screen | Route / behavior |
| --- | --- |
| Home | `/dashboard`: compact welcome, messages, spaces, online friends, voice shortcut, requests and invites |
| Spaces | `/dashboard/channels`: joined-space filtering and actual invitations |
| Space | `/dashboard/groups/[groupId]`: description, members, remembered conversation, channel sheet and permitted actions |
| Messages | `/dashboard/messages`: existing threads, decrypted previews, search, sort and friend chooser |
| Conversation | Existing group/channel route: dark channel layout or warm DM bubbles; compact header, tools and message-action sheets |
| Voice / direct call | Existing channel/call routes: participant gallery, media selection, bottom controls and call re-entry |
| Friends | `/dashboard/friends`: actual friends, online filter, incoming/outgoing requests, email search and existing actions |
| Search | New `/dashboard/search`: people from joined spaces/friends, spaces, channels and recent encrypted messages |
| Notifications | New `/dashboard/notifications`: real event types, filtering, deep links and mark-read actions |
| Creation | New `/dashboard/create`: supported Details → Review → existing group API; Back returns to details |
| Profile | Existing `/dashboard/profile`: identity, connections, edit profile, settings categories and focused sections |

Remembered channels are stored per account and group and validated against that group's channel list. Settings categories and create review integrate with native browser history. The visual inspection found and fixed Review's first-tap URL/render mismatch by removing copied Next internal history fields. First tap, Back, Forward and Edit details are now exercised by the browser harness.

## 5. Existing functionality reused

Authentication, friendship-only DM creation, email friend search, request acceptance/rejection, invites, owner/admin group actions, group/channel creation, encrypted messages, replies, reactions, polls, pinning, reporting, profile updates, password changes, logout, voice settings, push registration, incoming calls, WebRTC media, push-to-talk, device selection, and Listen Together APIs were retained.

Optional right-to-left swipe reply and long press supplement visible message actions. A 24px edge exclusion protects OS back gestures; vertical scrolling and opposite-direction drags are excluded. The composer tools sheet exposes existing functions rather than pretending uploads or voice messages work.

## 6. Backend changes and why

There are no API handler, authorization, schema, migration, or database-configuration changes.

New authenticated server pages read existing data:

- Search selects the latest 100 encrypted messages only from channels where the user is a member. Decryption and matching happen on the user's device.
- Notifications select up to 60 current-user, nonexpired events.
- Existing Home and Groups reads supply real recent thread previews, member photos, and invitations to the mobile composition. Home sends only four recent thread previews to the client.

These reads connect the requested screens to actual data without adding a second backend or exposing privileged credentials.

## 7. PWA and system integration

- The shared mobile breakpoint includes installed coarse-pointer PWA windows, addressing the desktop-layout fallback reported on phones.
- Existing viewport handling is reused for keyboard resize, visual-viewport offsets, rotation, and pinch zoom. Safe-area padding covers the top bar, bottom tabs, sheets and page frame.
- Existing manifest icons, start URL, app identity and install mode are retained. Messages, Groups and Search shortcuts were added.
- The existing push worker gains a small public offline fallback cache. Authenticated HTML, API responses, ciphertext histories and mutation requests are not cached by this worker.
- Registration does not request notification permission. The existing explicit notification setup flow is preserved.
- No forced worker activation or page reload was added; an update does not deliberately interrupt an active call. A waiting update normally requires the old tabs/windows to close before activation.
- A connected call can opt into screen wake lock. It is off by default, released on cleanup, reacquired after visibility resumes when allowed, and reports failure.
- Video Picture-in-Picture controls appear only when supported, with visible errors. Hardware/browser testing remains pending.
- Listen Together remains global across dashboard route changes, retains a visible YouTube player, and surfaces connection, command and autoplay errors.

## 8. Responsive breakpoints

The shared contract is:

```css
(max-width: 639px),
(display-mode: standalone) and (pointer: coarse) and (max-width: 1024px)
```

Normal browser windows at 640px and above retain the existing wider composition. Installed coarse-pointer windows through 1024px use the mobile composition. This is intentional, and tablet/landscape visual QA is still required.

Required 360 / 375 / 390 / 412 / 430px widths are covered by actual browser captures and layout/interaction measurements as well as gesture-boundary tests. See the [visual comparison report](val-mobile-visual-comparison.md) for screen coverage, short viewport cases and evidence limits.

## 9. Accessibility improvements

Important mobile icon and sheet controls have at least 48px touch targets. Message body text is 16px with 1.5 line height. Supporting metadata remains smaller. Controls have accessible names, selected/pressed state, disabled and pending states, visible errors, and keyboard alternatives.

Sheets have labelled dialog semantics, focus containment, Escape and Back dismissal, and trigger restoration. Mobile sheet background siblings are temporarily inert. The mobile tour and notification setup also contain focus and make background content inert, with bounded scrolling panels. Review progress receives focus after advancing creation. Music close restores an available trigger. Latin Extended subsets support Turkish glyphs without changing the approved font family.

Swipe reply and long press are optional; visible actions remain available. Sheet motion uses a sampled damped spring and is disabled under reduced-motion preferences. No new ambient animation or shader dependency was added.

Screen-reader behavior, enlarged system text, contrast measurement across all states, and physical touch comfort have not been certified yet.

## 10. Known application limitations / research not implemented

These are explicit implementation gaps, not claims that the browser makes them impossible:

| Research / concept capability | Current limitation and treatment |
| --- | --- |
| Public discovery, trending categories and suggested communities | No public discovery model/API exists. Groups shows real joined spaces and invites. No invented popularity data. |
| Five-step creation with cover, category and access policy | Existing group creation supports name and description only. Details/Review uses that contract; current photo/invite tools remain available afterward. Privacy/category/cover fields require a separate product/schema decision. |
| Profile bio, public handle, public profile sharing | These fields/routes do not exist. Actual name, email, image and status are used. |
| Chat images/files, camera capture, recorded video and voice messages | No attachment upload, storage or encrypted media pipeline exists. No fake attachment controls or demo content were added. |
| Message edit/delete, delivery/read receipts and typing indicators | The repository lacks these message pipelines. Existing replies, reactions, polls, pins and reports are retained. |
| Dedicated mentions/reaction notification categories | Existing notification types do not supply those events. Filters use only real available types. |
| Full encrypted-history global search | Search covers the latest 100 authorized messages. Older messages can be searched within the existing conversation history UI. Device key availability still determines decryption. |
| Rich offline conversations and automatic sending queue | No private message cache or background sending queue was added. Drafts survive dashboard navigation only; reload/logout clears them. Failed sending retains the existing retry/error behavior. |
| A native incoming-call surface or guaranteed background call lifetime | Web push/deep links and existing incoming-call UI are reused; OS call integration is not implemented. |
| Audio-only, background YouTube mini-player | Existing visible-player and visibility rules are retained. The mini-player includes the video, so it occupies more space than an audio-only concept. |
| Live notification list refresh / history pagination | New notification page is a bounded snapshot with read actions. Existing watchers/push remain; this page does not yet have pagination or a new realtime subscription. |
| Shared server preferences | Existing settings still include device-local preferences; those toggles are not presented here as new cross-device server functionality. |
| Contacts, location/maps, share target, media paste and exported chat/downloads | These require missing product handlers, consent flows and, for attachments, storage. They were not added as unrelated features. |
| QR login/device pairing, passkeys and active-device security inventory | No supporting authentication flows are implemented in this revision. These are separate security/backend work, not inherently native-only. |
| General permission dashboard, OS DND inspection, Web Bluetooth device management | Existing microphone/camera/push/device recovery UI is reused. No speculative system-control dashboard was added. |
| New haptics, orientation lock, app-update prompt and adaptive low-bandwidth video | Not added in this revision. Existing notification vibration, viewport rotation handling, media stats and connection recovery remain. |

## 11. Browser and PWA limitations

Screen capture is not available in all browsers, requires a secure context and user activation, and cannot retain permission for later reuse. Captured audio depends on browser, OS and selected surface; installing a PWA does not make an unavailable capture API work. [MDN screen capture](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).

Wake lock is for visible documents and may be released or rejected by the system. [MDN wake lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API). Picture-in-Picture is browser-controlled and support must be checked. [MDN Picture-in-Picture](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API).

Home Screen web apps on supported iOS/iPadOS versions can request Web Push after direct user interaction; device settings still govern delivery and presentation. This is different from native VoIP calling integration. [WebKit Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

YouTube embeds require a minimum 200×200px player viewport. [YouTube iframe requirements](https://developers.google.com/youtube/iframe_api_reference). VAL retains visible playback and does not bypass the provider's background-player restrictions. [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies).

No guarantee is made about calls surviving a killed page, lock screen, background suspension, Bluetooth route changes, Wi-Fi/data handoff or OS audio interruptions. These need actual device testing; a service worker is not a continuously running call process.

## 12. Features requiring native Android/iOS work

Integrating VoIP calls with the OS call interface and audio-routing lifecycle requires a native implementation: iOS PushKit/CallKit and Android Telecom are the relevant platform integrations. [Apple PushKit documentation](https://developer.apple.com/documentation/pushkit/supporting-pushkit-notifications-in-your-app), [Android Telecom documentation](https://developer.android.com/develop/connectivity/telecom/voip-app/telecom).

Guaranteed native-grade call behavior cannot be claimed from this PWA implementation. A native project would also need its own background execution, audio focus, permission, interruption and recovery implementation. Merely wrapping the web UI does not establish those behaviors or remove YouTube playback restrictions.

## 13. Tests performed

Automated command:

```text
node --test tests/mobile-experience.test.mjs tests/chat-presentation.test.mjs tests/media-client.test.mjs tests/dependency-audit.test.mjs
```

Result: **52 passed, 0 failed, 0 skipped**. Breakdown: 20 mobile tests, 6 chat/viewport tests, 20 media tests, 6 dependency-audit policy tests. The navbar cases cover validated destinations/defaults/empty selection, bottom-only floating, selected routes and account-scoped storage keys.

Coverage includes stable destinations, account/channel draft isolation and bounds, validated channel memory, Unicode matching, swipe edge/vertical exclusions at all five widths, public-only offline caching, uncached private navigation, worker cleanup, coalesced music refreshes and disposal, keyboard/rotation/zoom behavior, participant discovery and media coexistence/cleanup. Media tests use test doubles and do not establish audible hardware behavior. Audit-policy tests are not a live package vulnerability audit.

The newer visual inspection uses Playwright with installed Edge in isolated local browser contexts. The [gallery](mobile-visual-qa/index.html) and [matrix](mobile-visual-qa/after/matrix.json) retain individual final screenshots and measured results for all five widths, including lower scroll positions, keyboard-sized composer/music views, context sheets, connected muted voice/music surfaces, all eight mobile tour steps and notification setup. These evidence files remain local and are intentionally excluded from the application release commit; their relative links require the development workspace.

Final evidence: 151 mobile screen/state views at every width, 755 mobile screenshots plus three desktop screenshots, 80/80 browser interaction checks and 425/425 navbar layout checks passed, no capture/page failures, no document overflow and no undersized visible VAL control targets in the measured states. Five additional music Play resting/pressed/released checks and screenshots pass without issuing playback commands. Desktop Home/channel at 1440×1000 have zero changed pixels; Messages retains existing “Friends Chat” copy that differs from the baseline. A text-only control restores the baseline description in an isolated DOM probe and produces zero changed pixels, confirming the copy-related reflow. See the comparison report for exact results, exclusions and intentional reply-preview clamps.

Browser assertions cover first-tap Review, Back/Forward/Edit details, settings history, sheet closure/link history/trigger focus, inert backgrounds, draft retention, reply focus, short-sheet scrolling/focus, stable destinations and filters, single-account call/music persistence, offline-banner fit and onboarding focus/dismissal. These exercise actual implemented local screens, not test-double UI.

Navbar checks cover every position and bottom-floating layout across 14 page families, connected rooms, mini-calls and crowded bars. They verify the Settings-only editor, hidden-bar recovery, default restoration, bottom-only floating, account/reload persistence, intact position labels, sheets, delayed loaders, keyboard space release and portalled music containment. Final focused reruns at all five widths verify that an empty top bar releases its 68px reservation, the frame fills the available bounds, native report-sheet accents use readable orange, and crowded-navbar Search captures show the settled destination. Nineteen states at each width use a short 500px viewport; the remaining main captures use 844px height.

The Home checks use real emulated touch events for drag/drop/cancel and ordinary scrolling, keyboard reorder/cancel, reload persistence and two existing accounts to verify layout isolation. Delayed-navigation checks slow actual route requests without substituting response data, verify the VAL loader and its cleanup, then check a cached Back transition for no loader flash. These do not establish physical phone gesture comfort or production navigation latency.

The navigation checks now follow Spaces and Messages to their actual routes, verify selected state, and inspect the normal Profile icon for accounts without a photo. Music checks verify retained search focus, typing, the settled orange focus border and actual paused-track metadata/transport colors. A final color pass replaced inherited brown/blue/purple avatar, player, search-placeholder and settings surfaces with the mobile palette; music actions/progress use orange while Leave remains red. The embedded YouTube artwork and branded controls are preserved. The local accounts have no profile photos, so positive photo rendering and its load-error fallback are inspected in code but remain unproven with real account data.

The computer-use runtime still fails before executing with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`. The isolated repository test runner supplies the saved evidence without using the user's personal browser session. This is not evidence of an extension disconnect or an app rendering failure.

## 14. Build, typecheck and lint results

| Command | Final result |
| --- | --- |
| `npm run lint` | Passed, exit 0, no warnings |
| `npx tsc --noEmit` | Passed, exit 0 |
| Test command above | Passed, 52/52 |
| `npm run build` | Passed, exit 0; compiled in 3.9s, TypeScript in 1838ms, 47 static pages generated; authenticated routes included |
| `git diff --check` | Passed; only existing Windows LF/CRLF normalization notices |

The local build used process-local `NODE_OPTIONS=--max-old-space-size=1536`, `CHECKPOINT_DISABLE=1`, `CIRCLE_NODE_TOTAL=3`. No environment file values were changed or exposed. Building generated the ignored Prisma client; it did not run a migration or deploy the app.

## 15. Remaining work and user action

The five-width visual evidence is linked above. Remaining verification requires actual data/devices:

1. Inspect populated DM conversations, friends/requests, invitations, notification events and a real profile photo in navigation. The existing local QA database has no DM threads, friendships or notifications, and its four users have no profile photos; screenshots preserve real empty states and the normal Profile icon. Do not substitute fabricated data.
2. Test physical Android/iOS installed PWAs: standalone ratio, nonzero safe areas, actual keyboards, installation, worker update/offline fallback, notification permissions/deep links, camera/mic revocation, wake lock, PiP, Bluetooth, interruptions and network handoff.
3. Run a two-account media check: audibility, mute/push-to-talk, simultaneous camera/screen, route changes, screen stop, disconnect/reconnect and cleanup. Test playback/DJ permissions, autoplay recovery and another participant starting music. Local browser QA joins muted and does not establish audible or camera/screen behavior.
4. Extend verification to landscape/tablet, enlarged system text, screen readers, full contrast measurement and actual rendering/performance profiles.

No user approval or publishing action is required to review the local report. Populated test accounts and physical phones are needed for those remaining checks. Production credentials are not included in the evidence. The platform remains under development, and no full-production-readiness claim is made.
