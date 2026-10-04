# VAL mobile visual comparison

2026-10-04 · local development · `codex/val-mobile-app-experience`

This pass inspected the implemented mobile compositions against the supplied ten Doshab references and the VAL Mobile UX Research Plan. It corrected presentation and existing interactions, including navigation/overlay bugs. Later explicit requests added device-local Home section ordering, delayed navigation feedback and Settings-only navbar customization. No backend model, migration, logo, desktop sidebar design, push, commit, or deployment was introduced.

## Review the evidence

Screenshot files and the interactive gallery are retained in the development workspace. They are intentionally excluded from the application release commit; the relative evidence links below require that workspace.

- [Interactive reference / before / after gallery](mobile-visual-qa/index.html): choose a screen and 360 / 375 / 390 / 412 / 430px width. Click any image to open the original individual capture.
- [Final layout and browser-check evidence](mobile-visual-qa/after/matrix.json).
- [Baseline evidence](mobile-visual-qa/before/matrix.json).
- [Desktop pixel comparison](mobile-visual-qa/desktop-comparison.json).
- [Gallery and five-width verification summary](mobile-visual-qa/verification.json).
- [Music Play resting / pressed / released checks](mobile-visual-qa/music-button-states.json) and [pressed screenshots](mobile-visual-qa/button-states/music-play-pressed-390.png).
- [Desktop Messages text-only comparison control](mobile-visual-qa/desktop-copy-probe.json).
- [Architecture, implemented capabilities and remaining product gaps](val-mobile-development.md).

The baseline has 200 mobile captures plus three desktop captures. Final coverage includes lower scroll positions, connected call/music surfaces and onboarding states added during inspection; these have an explicit “no baseline captured” explanation in the gallery. Reference artwork is copied unchanged into `mobile-visual-qa/references/`.

## Findings and changes

| Screen family | What inspection found | Correction and evidence at 390px |
| --- | --- | --- |
| Home | An actual email-length display name overflowed the hero; children shrank into the actions. Passive orange typography competed with primary controls. | Contained the name, stopped flex shrinking, balanced heading line height, used ink for the welcome heading and reserved orange for actions. Unified 12px page spacing and 10px paper chamfers. A single joined-space card uses the available width. [Before long name](mobile-visual-qa/before/home-long-name-390.png), [after](mobile-visual-qa/after/home-long-name-390.png), [lower page](mobile-visual-qa/after/home-lower-390.png). |
| Home section ordering — explicit follow-up | The user requested dragging Home layouts up/down. | Conversation, spaces, friends and requests sections have 48px handles, touch/pointer dragging, bounded previews, edge scrolling and keyboard pick-up/move/drop/cancel. Section order survives reload and is isolated by account on this device. Ordinary content still scrolls. The welcome/actions/voice context stays anchored. [Reordered Home](mobile-visual-qa/after/home-reordered-390.png), [dragging](mobile-visual-qa/after/home-dragging-390.png). |
| Space-card avatar color — explicit follow-up | The supplied localhost screenshot identified blue logo/member fallback tiles. | Scoped the reusable mobile space-card avatar backgrounds to `#25352b`, borders to `#617266`, and icons to `#dce5dc`. Logo geometry and actual photos are preserved. Computed colors are checked in the browser. [Corrected tiles](mobile-visual-qa/after/home-lower-390.png). |
| Page switching — explicit follow-up | The user requested immediate fast transitions and loading feedback when waiting. | A 150ms threshold shows the existing VAL loading design for pending mobile tab requests and dashboard/channel route fallbacks. Completion/unmount cancels the timer; no minimum display time or artificial route delay is introduced. Navigation remains reachable. Controlled latency uses real route responses; cached Back is checked for no loading flash. [Delayed navigation](mobile-visual-qa/after/mobile-loading-390.png). |
| Navbar customization — explicit follow-up | The user requested Settings-only add/remove buttons, top/bottom/left/right placement and bottom-only floating, with comfortable page fitting. | The default remains Home / Spaces / Messages / Profile. Eight existing destinations can be selected. Per-account device preferences are validated, reloadable and restorable, with visible errors. Removing Profile/all buttons retains a Settings shortcut. Page width/height, loaders, call controls and portalled music reserve the selected geometry; crowded bars scroll, and keyboard entry releases navbar space. [Settings](mobile-visual-qa/after/settings-navigation-390.png), [floating](mobile-visual-qa/after/navbar-floating-home-390.png), [left](mobile-visual-qa/after/navbar-left-home-390.png), [right channel](mobile-visual-qa/after/navbar-right-channel-390.png), [top](mobile-visual-qa/after/navbar-top-home-390.png). |
| Friends icon — explicit follow-up | The user wanted Friends to be distinct from Profile. | A dedicated handshake appears in the mobile navbar, its Settings picker and Profile connections. Profile retains the existing silhouette/photo behavior. [All buttons](mobile-visual-qa/after/navbar-all-buttons-bottom-390.png). |
| Groups, invitations and space | Search/filters and existing desktop-derived panels had inconsistent sizing and hierarchy. | Dark readable search, 48px controls, horizontally reachable filters, consistent paper sections, compact space context and reachable channel/settings actions. [Groups](mobile-visual-qa/after/groups-390.png), [invitations](mobile-visual-qa/after/invitations-390.png), [space](mobile-visual-qa/after/space-390.png). |
| Space settings | The inherited heading was oversized and clipped. Dense lower controls needed a scroll review; legacy metadata rendered purple. | Scoped 34px heading with wrapping, 16px panel padding, readable muted metadata and comfortable existing actions. [Before](mobile-visual-qa/before/space-settings-390.png), [after](mobile-visual-qa/after/space-settings-390.png), [lower](mobile-visual-qa/after/space-settings-lower-390.png). |
| Messages and new-message chooser | Hero line height and search/sort spacing did not form a clear mobile hierarchy. | Corrected heading line height, readable form controls and bounded chooser geometry. Existing empty states and friendship gating remain. [Messages](mobile-visual-qa/after/messages-390.png), [chooser](mobile-visual-qa/after/message-chooser-390.png). |
| Friends and requests | Inherited compact tabs and helper text were uncomfortable at narrow widths. | 48px tabs/actions, consistent people sections and readable real empty states. No fictional people or requests. [Friends](mobile-visual-qa/after/friends-390.png), [requests](mobile-visual-qa/after/friend-requests-390.png), [email search](mobile-visual-qa/after/find-friends-390.png). |
| Search | A more specific legacy input rule leaked a white fill into the dark search bar; helper text lacked contrast. | Corrected the actual winning selector, input typography, helper contrast and horizontally scrolling filters. Checked real group/channel search results at the top and bottom. [Before](mobile-visual-qa/before/search-390.png), [after](mobile-visual-qa/after/search-390.png), [results](mobile-visual-qa/after/search-results-390.png), [lower results](mobile-visual-qa/after/search-results-lower-390.png). |
| Notifications | Activity heading, filters and read controls needed the same hierarchy and target sizing as other pages. | Unified existing activity/empty state surfaces and 48px controls. Existing event types only. [Notifications](mobile-visual-qa/after/notifications-390.png). |
| Creation | The first Review tap changed the URL but kept Details visible. Copying Next's internal history fields bypassed its search-parameter update. | Pass only VAL's own history marker and let Next copy its internal fields. Review now opens on the first tap; Back, Forward and Edit details retain name/purpose. No group was created by QA. [Before stuck Review](mobile-visual-qa/before/create-review-390.png), [correct Review](mobile-visual-qa/after/create-review-390.png), [Details](mobile-visual-qa/after/create-details-390.png). |
| Profile and settings | Long forms, switch labels and range/file controls needed ergonomic sizing. Yellow voice labels and pale green diagnostic text were hard to read on paper. | 48px control/label areas, legible form spacing, heading line heights, muted readable labels and darker success/warning text. Reviewed voice settings at three scroll positions and notification settings at both ends. [Profile](mobile-visual-qa/after/profile-390.png), [edit lower](mobile-visual-qa/after/edit-profile-lower-390.png), [voice middle](mobile-visual-qa/after/settings-voice-middle-390.png), [voice lower](mobile-visual-qa/after/settings-voice-lower-390.png). |
| Channel and composer | Desktop-derived composer colors, timestamps, action styling and reply preview competed with the dark conversation. | Dark channel/composer, 16px body text, readable metadata/replies, quiet 48px message actions and compact context. Keyboard-open layout hides global brand/navigation and keeps the composer within the visible viewport. [Channel](mobile-visual-qa/after/channel-390.png), [reply](mobile-visual-qa/after/reply-390.png), [500px keyboard viewport](mobile-visual-qa/after/keyboard-chat-390.png). |
| Context sheets | Spacing, action double borders, bounded height and background interaction were inconsistent. | Bottom-aligned bounded sheets with scrollable content, 48px controls, single action borders, focus containment and restored trigger focus. Background siblings are inert while a mobile sheet is open. Verified native Back, sheet links and tools-to-emoji transitions. [Members](mobile-visual-qa/after/channel-members-390.png), [actions](mobile-visual-qa/after/message-actions-390.png), [short poll](mobile-visual-qa/after/short-poll-390.png). |
| Voice room | The mobile lobby lacked clear route context, and paper participant/gallery surfaces did not match the dark voice reference. | Explicit mobile Back/context, compact lobby, dark gallery/participants, stable thumb-zone controls and red Leave. Existing desktop context remains separately composed. [Lobby](mobile-visual-qa/after/voice-390.png), [connected muted room](mobile-visual-qa/after/voice-workspace-390.png), [controls](mobile-visual-qa/after/voice-controls-390.png), [persistent mini-call](mobile-visual-qa/after/mini-call-390.png). |
| Listen Together | Player body/header colors diverged, blue controls/metadata competed with the platform palette, and mini Play was only 44px wide. An existing paused track exposed a 42px title link and remaining blue artist/status/genre/volume styling. | Scoped mobile dark player, neutral metadata, orange Play/focus/progress accents, internally scrolling results and 48px transport/title targets. Tested retained search focus and typing, expansion/minimization, close, route persistence and keyboard viewport containment. Browser assertions verify metadata and Play colors. Existing paused music and real search results were inspected without issuing playback commands. YouTube's embedded artwork and branded controls remain unchanged. [Now playing](mobile-visual-qa/after/music-now-playing-390.png), [lower controls](mobile-visual-qa/after/music-now-playing-lower-390.png), [search](mobile-visual-qa/after/music-390.png), [keyboard](mobile-visual-qa/after/keyboard-music-390.png), [mini](mobile-visual-qa/after/music-mini-390.png). |
| Guided tour and notification setup | Generic `.app-panel` positioning overrode the tour's fixed placement, leaving its top above the viewport. Final mobile links used desktop destinations. | Scoped fixed/bounded panels, dark backdrop, scroll containment, 48px controls, mobile focus trapping and inert background. Mobile links use the existing Settings/Create routes. All eight tour steps and notification setup/manual instructions were captured. [Tour start](mobile-visual-qa/after/tour-1-390.png), [finish](mobile-visual-qa/after/tour-8-390.png), [notification setup](mobile-visual-qa/after/notification-setup-390.png), [short setup](mobile-visual-qa/after/short-notification-setup-390.png). |
| Offline and bottom navigation | Offline notice could cover the brand header; active tabs retained competing legacy borders. The user requested Spaces, Messages, a new Spaces icon and real profile photos. | Reserved banner height below the brand, adjusted frame/keyboard offsets, and kept one orange selected underline. The four destinations are Home / Spaces / Messages / Profile. Spaces uses stacked layers; Profile uses the account photo with a normal icon for missing/failed images. Route selection and the no-photo icon are browser-checked. [Home navigation](mobile-visual-qa/after/home-390.png), [Spaces selected](mobile-visual-qa/after/groups-390.png), [Messages selected](mobile-visual-qa/after/messages-390.png), [offline](mobile-visual-qa/after/offline-390.png). |

## Reference and research alignment

The visual checks used deliberate Doshab paper/dark contrast, restrained orange signal accents, the existing condensed display font, chamfered structural sections, readable 16px message/form text and lower-zone actions. Approved VAL artwork/logo geometry remains unchanged. Large concept headings were adapted to actual 360px space and real display-name lengths.

| Supplied reference | Implemented screen checked | Deliberate difference |
| --- | --- | --- |
| [1 Home](mobile-visual-qa/references/home.png) | Home and lower sections | Existing account data, actual space count and honest empty states. |
| [2 Messages](mobile-visual-qa/references/messages.png) | Messages, search/sort and chooser | No local DM threads exist, so populated rows and unread badges are not proven. |
| [3 Direct chat](mobile-visual-qa/references/direct-chat.png) | Shared composer/sheet/keyboard behavior checked in a real channel | No actual DM thread exists locally. Warm DM bubble composition remains implemented but lacks a final populated screenshot. No attachment/voice-message controls were invented. |
| [4 Channel](mobile-visual-qa/references/channel.png) | Existing channel, reply, poll and action sheets | Real encrypted-history fallback is displayed when a fresh device lacks old keys. No fabricated message content, typing or receipts. |
| [5 Discover](mobile-visual-qa/references/groups.png) | Joined spaces, invitations and space overview | Public discovery, categories and trending are outside the implemented model; no new feature added. |
| [6 People](mobile-visual-qa/references/friends.png) | Friends, requests and existing email search | Local friends/requests are empty. Suggestions/mutual counts were not fabricated. |
| [7 Activity](mobile-visual-qa/references/notifications.png) | Notifications and existing setup/settings | Existing event filters only; local activity is empty. |
| [8 Search](mobile-visual-qa/references/search.png) | Search, accessible filters and actual space/channel results | Recent authorized encrypted messages only; no new global search backend. |
| [9 Create](mobile-visual-qa/references/create.png) | Existing Details / Review | Existing API supports name/purpose, not the concept's five-step privacy/category/cover model. |
| [10 Voice](mobile-visual-qa/references/voice.png) | Lobby, gallery, controls, mini-call and music | Actual single-account muted connection; no invented speakers, listeners or media. |

The research's four-tab composition remains the default. Later explicit requests authorize customization in Settings, with 48px touch areas, readable text, safe-area CSS, contextual sheets and persistent communication preserved across bar placements. Default labels/destinations are Home / Spaces / Messages / Profile; Search also remains reachable from Profile's connections list. Browser emulation establishes viewport/layout behavior; it does not certify native safe-area insets or real on-screen keyboards.

The final color review keeps paper `#f4f2e9`, dark surfaces and neutral green-gray metadata consistent. Orange `#ff5500` identifies primary actions/selection; a lighter orange marks focus. Success/warning text uses readable dark tones on paper, and red remains the Leave/error signal. Avatar fallbacks and profile previews no longer inherit unrelated brown/blue fills. No approved artwork or desktop palette was recolored.

## Validation

Final evidence: **151 mobile screen/state views at each of five widths = 755 mobile screenshots**, plus three desktop screenshots. The full five-width interaction run has **80/80 checks passed** and **425/425 navbar layout checks passed**, with no capture failures or browser page exceptions. Coverage includes every navbar placement, floating/hidden/crowded bars, reordered/dragging Home, delayed navigation, lower scroll positions and existing paused music. Five additional pressed-state screenshots and **5/5 resting / pressed / released checks** verify the music Play interaction without issuing playback commands.

| Width | Saved mobile views | Browser checks | Document overflow | Undersized visible targets |
| --- | ---: | ---: | ---: | ---: |
| 360px | 151 | 16 passed | 0 | 0 |
| 375px | 151 | 16 passed | 0 | 0 |
| 390px | 151 | 16 passed | 0 | 0 |
| 412px | 151 | 16 passed | 0 | 0 |
| 430px | 151 | 16 passed | 0 | 0 |

Each width includes 19 cases at 500px height: composers, music, poll, notification setup and crowded bars. All other mobile captures use 844px height. Measurements found no unintended heading/text clipping in their measured selectors; ten flagged one-line reply previews are intentionally clamped. Position-label line measurements also prevent split words in the narrow settings picker. These are automated layout measurements plus screenshot review, not a full accessibility certification. VAL controls and labeled form targets are measured; cross-origin YouTube controls are outside this DOM measurement.

Desktop Home, channel and Messages were captured at **1440×1000** before/after. Home and channel have **0 changed pixels out of 1,440,000**. Messages has **188,556 changed pixels**: the current existing description is “Friends Chat,” while the baseline has the longer earlier description. That copy and its resulting vertical reflow were preserved. An isolated temporary DOM text-only control using the baseline description produces **0 changed pixels**; neither the app source nor canonical final screenshot was altered by that control. This supports attributing the difference to copy rather than mobile styling. Mobile overrides remain inside the existing mobile/installed-coarse-pointer media contract. Other desktop widths and populated desktop states were not pixel-certified.

| Command/check | Result |
| --- | --- |
| `npm run lint` | Exit 0; no warnings/errors |
| `npx tsc --noEmit` | Exit 0 |
| `node --test tests/mobile-experience.test.mjs tests/chat-presentation.test.mjs tests/media-client.test.mjs tests/dependency-audit.test.mjs` | 52 passed, 0 failed/skipped |
| `npm run build` | Exit 0; compile 3.9s, TypeScript 1838ms, 47 static pages |
| `git diff --check` | Exit 0; Windows LF/CRLF normalization notices only |
| `VAL_QA_EXTRA=1 node .codex-temp/mobile-visual-runner/matrix.mjs after` | Full 758-capture run; 80/80 browser checks, 425/425 navbar layout checks; 0 failures/page exceptions |
| Focused `matrix.mjs after` reruns at all five widths | Retook affected report-sheet and navbar states; verified orange native radio accents, Settings persistence/account isolation, full hidden-bar frame bounds and settled Search before capture |
| `node .codex-temp/mobile-visual-runner/pressed-check.mjs` | 5/5 resting/pressed/released checks and screenshots, no music commands issued; desktop Messages text-only control has 0 changed pixels |
| `node .codex-temp/mobile-visual-runner/report.mjs` | Reference/baseline/final gallery, catalog and desktop pixel comparison generated |
| `node .codex-temp/mobile-visual-runner/gallery-check.mjs` | All 755 screen/width gallery selections load, no gallery page errors or mobile overflow; ten copied references are byte-identical to the supplied files |

The build used process-local `NODE_OPTIONS=--max-old-space-size=1536`, `CHECKPOINT_DISABLE=1` and `CIRCLE_NODE_TOTAL=3`; no environment file was edited. Media unit tests use doubles and do not prove hardware behavior. The dependency policy tests are not a live vulnerability audit.

The browser harness checks sheet Back/trigger focus, sheet-link history, reply focus/composer position, draft retention, sheet transitions, short-sheet scrolling/focus, Review first-tap/Back/Forward/Edit details, settings category history, four navigation destinations/filter access, actual muted voice/music persistence, offline-banner fit, and all tour/setup steps with focus containment/dismissal. Additional checks cover touch drag/drop/cancel, normal touch scrolling, keyboard reorder/cancel, reload persistence, real-account preference isolation, avatar colors, delayed route feedback and cached-return flash avoidance. Layout measurements cover document overflow, visible control targets, headings, dialogs and composer bounds.

Navbar geometry covers 14 page families × five layouts × five widths (350 route measurements), plus connected room, mini-call and all-button layouts (75 measurements). Settings checks include add/remove/all-hidden/default restoration, bottom-only floating, reload persistence and account isolation. Every placement also checks sheets, keyboard space release, loaders, music containment and crowded bars at both heights.

After the full matrix, final screenshot review found a leftover 68px reservation when every top-navbar button was removed. The empty bar now releases that space; a direct frame-bounds assertion verifies all five widths. Native report-sheet radio/checkbox accents were scoped to readable orange (`#ad501e`). Focused five-width reruns retook these affected states and rechecked Settings persistence/account isolation. The crowded-navbar Search capture now waits for the destination to settle. Other full-matrix evidence was retained. A separate final check limits the Play shadow to its resting state and verifies the existing pressed interaction at every width without issuing playback commands.

The retained one-line reply preview is intentionally clamped; this is distinguished from unintended heading clipping. Native checkbox/radio hit areas are measured through their clickable labels. When a modal is open, target sizing is evaluated in that modal, not its inert background.

## Files changed in this inspection pass

Product changes are concentrated in:

- `app/dashboard/mobile.css`: mobile-only visual/ergonomic/viewport overrides.
- `components/layout/dashboard-shell.tsx`: mobile voice context; desktop context preserved.
- `components/ui/dialog-surface.tsx`: temporary mobile background inertness.
- `components/chat/realtime-message-panel.tsx`: class hook for the existing reply preview.
- `app/dashboard/groups/[groupId]/settings/page.tsx`: class hook for the existing settings wrapper.
- `components/mobile/mobile-create-space.tsx`: correct Next history synchronization.
- `components/mobile/mobile-shell.tsx`: Spaces/Messages destinations, selected states and account-photo/fallback rendering.
- `components/mobile/mobile-navbar-preferences.tsx`, `mobile-navbar-settings.tsx`, `lib/mobile-navbar.ts` and `app/dashboard/layout.tsx`: account-scoped device preferences and the Settings-only customization editor.
- `components/profile/profile-settings-panel.tsx`: mobile Navigation bar category and native category history synchronization.
- `components/mobile/mobile-ui.tsx`: stacked-layer Spaces, distinct Friends handshake and Settings shortcut icons.
- `components/mobile/mobile-profile.tsx`: keep the existing Search screen reachable after replacing its primary tab with Messages, recognize navigation settings and use the Friends handshake.
- `lib/mobile-navigation.ts` and `tests/mobile-experience.test.mjs`: updated primary destination mapping and routing assertions.
- `components/mobile/mobile-home.tsx`, `mobile-home-sections.tsx` and `lib/mobile-home-order.ts`: requested Home ordering, bounded pointer/keyboard interaction and account-scoped local preferences.
- `components/mobile/mobile-page-loading.tsx`, `components/ui/loading-states.tsx` and the existing channel `loading.tsx`: delayed mobile loading feedback; desktop loading composition preserved.
- `components/onboarding/dashboard-onboarding-coordinator.tsx`: scoped overlay hook, mobile focus/background handling and destination links.
- This report, `val-mobile-development.md` and `mobile-visual-qa/` evidence/gallery.

Earlier architecture work is listed separately in the development report. QA helpers/dependencies live under `.codex-temp/mobile-visual-runner/`; no application dependency or lockfile was added for screenshots.

## Method and verification limits

Screenshots use a built local Next preview at `http://localhost:3100`, headless installed Edge through Playwright, mobile/touch emulation, DPR 1, 844px height and reduced motion. Short composer/music/setup cases use 500px height. The existing local PostgreSQL database and real memberships/messages were used. The harness signs an in-memory legacy local session for an existing account; it does not test password login, Supabase sign-in or production sessions. No credential/token is saved in these artifacts.

The connected room test joins muted, opens the existing music surface and then leaves. It does not request camera/microphone/screen permission or issue playback commands; the existing paused track is inspected. Browser-generated device keys cannot decrypt messages encrypted before that device joined; that existing error state is shown honestly. Device-local Home/navbar preferences were changed through the UI; server account/space settings, creation and reporting mutations were not submitted. No mock users, friends, invitations, notifications or messages were inserted.

The computer-use runtime still fails before executing with a kernel asset-path error. These captures use an isolated repository browser-test runner, not the user's personal browser session.

Remaining evidence gaps:

- Populated DM thread, friends, incoming/outgoing requests, invitations and notification events require existing populated test accounts. Local DB counts for DMs/friendships/notifications are zero.
- All four local users have no profile photo. The normal navigation icon is captured and checked; real-photo rendering and image-error fallback are implemented and code-inspected, but require a real account photo for browser proof.
- Android/iOS installation, standalone mode on real phones, nonzero notch/home-indicator insets, OS keyboard pan/resize and WebKit behavior are not proven by Edge emulation.
- Two-account audibility, simultaneous camera/screen, Bluetooth/audio routing, interruptions, wake lock, PiP, permission recovery, push delivery and network handoff still require hardware QA.
- Landscape/tablet, enlarged system text, screen readers, full contrast certification, production login and measured rendering/performance profiles remain separate checks.
- Browser Back was tested for shared context sheets and create/settings states. The guided tour's visible Back/Finish/Skip controls are separate from the shared sheet history mechanism.

No user action is needed to review the local evidence. Populated accounts and physical phones are needed for the remaining data/device checks. VAL remains under development; this report is not a deployment-readiness claim.
