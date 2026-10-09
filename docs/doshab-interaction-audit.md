# Doshab Interaction Physics: repository audit

Status: audit only. Inspected on 2026-10-06. No product implementation is included.

Repository: VAL / Doshab. Branch: `codex/val-mobile-mini-player`. HEAD: `3a844ad4cf1d1932237d145b356c52e92f7bddfb`. Findings describe the working tree inspected, not a deployed application.

## Scope and evidence

The user's pasted request is the specification for this task. The supplied **Software Material Perception Research Metaplan.pdf**, at `D:\VAL\Software Material Perception Research Metaplan.pdf`, is supporting research. Its 14 pages were extracted; the material and token tables were also visually inspected. Its imperative recommendations do not authorize implementation, architecture replacement, sounds, new gestures, or a redesign. Its evidence labels and precise perception thresholds were not independently validated. See the [v1 proposal](doshab-interaction-physics-v1.md) for how that research is constrained by the request.

`VAL_ARCHITECTURE_REPORT.md` was consulted as an orientation document; its older snapshot is not the authority for current behavior. Findings below were checked against current source. Existing unrelated modified/untracked files were left untouched.

Search coverage: 218 application source files across `app/` (89), `components/` (83), and `lib/` (46), including four CSS files and excluding generated Prisma code. Additional targeted inspection covered `types/index.ts`, relevant Prisma models, the service worker/offline page, package metadata, installed Next.js navigation/loading guides, Tailwind defaults, and existing tests. There is no separate top-level `styles/` or `hooks/` directory. Search coverage is broader than detailed function-by-function inspection; the inspected-file register below identifies the main evidence.

Evidence terms:

- **Source-confirmed**: directly implemented in the inspected source.
- **Risk**: source gives a concrete reason to test; no claim of observed frame drops, CLS, browser failure, or production incident.
- **Legacy/dormant**: code exists but is hidden, overridden, or has no application consumer found.
- **Proposed**: future work only.

## Current behavior

### Architecture boundary

| System | Current implementation and evidence | Constraint for Interaction Physics |
| --- | --- | --- |
| Application and navigation | Next.js App Router, React, server-rendered pages, client interaction components; [dashboard layout](../app/dashboard/layout.tsx) and [package](../package.json). Persistent providers live in the shared dashboard layout. | Preserve component boundaries, routing, provider lifetimes, authentication, and server authorization. |
| Text | `EventSource` in [RealtimeMessagePanel](../components/chat/realtime-message-panel.tsx#L174); [messages route](../app/api/channels/[channelId]/messages/route.ts#L454) uses a process-local [message bus](../lib/message-bus.ts) and a 30,000 ms database catch-up/keep-alive interval. | Keep SSE and HTTP message submission. Animation completion must never control sending or reconciliation. |
| Media | [MediaClient](../lib/media/media-client.ts#L59) uses Supabase Realtime Broadcast/Presence for signaling and native `RTCPeerConnection` for media. | Preserve peer negotiation, tracks, permissions, and recovery. No Socket.IO, LiveKit, mediasoup server, or SFU is required or proposed. The `mediasoup-test` route name is not evidence of a mediasoup transport. |
| Calls | [PersistentCallProvider](../components/calls/persistent-call-provider.tsx#L141) polls friend-call status; [IncomingCallWatcher](../components/calls/incoming-call-watcher.tsx#L29) has foreground/background polling and existing alerts. | Keep call invitation/status distinct from signaling and peer media readiness. |
| Music | [MusicSessionProvider](../components/music/music-session-provider.tsx#L53) uses HTTP snapshots/commands, version checks, coalesced polling; YouTube iframe playback is separate from voice. | Retain server authority, command IDs, room identity, and local playback ownership. |
| Storage/offline | Prisma/PostgreSQL models; memory-only chat drafts; [service worker](../public/push-sw.js#L1) caches public fallback/brand assets only. | No database migration, CRDT, durable outbox, private-page cache, or plaintext draft persistence in this initiative by default. |

### Motion and transition inventory

There is no shared interaction-physics engine or mass-family registry. There are CSS transitions/keyframes, Tailwind utilities, browser-native scrolling, pointer handlers, and a few `requestAnimationFrame` loops. No application use of Framer Motion, React Spring, GSAP, Web Animations `element.animate()`, or a runtime spring solver was found in the source scan/package declarations.

The root imports `app/globals.css`; the dashboard imports `val-design.css` followed by `mobile.css`; music imports its own stylesheet through [MusicButton](../components/music/music-button.tsx). Cascade specificity and many `!important` rules matter more than file order alone. A CSS declaration existing in `globals.css` does not establish the current rendered behavior.

| Implementation | Current values/behavior | Evidence and reachability |
| --- | --- | --- |
| Common control transitions | Repeated 140 ms / 150 ms `ease`, with 160/180/200 ms exceptions; color, background, border, shadows, transforms, and some border-radius transitions. | Full declaration index in Appendix A. Global `:is(a,button,input,textarea,select)` sets 150 ms and `ease` at `globals.css:2322`; it does not restrict the transition property. |
| Dashboard buttons | `.app-button-*` / `.app-icon-button` receive a 150 ms important shorthand; hover rise and active depression have later overrides. Disabled transform is suppressed. | [val-design.css:53](../app/dashboard/val-design.css#L53), [active override:646](../app/dashboard/val-design.css#L646). Actual resting appearance is outside this task. |
| Dashboard navigation | Final rail rules suppress transforms and restrict transitions to background/color/border at 140 ms. A 1 s alternating `scaleX` progress line is tied to `useLinkStatus`. | [rail rules:891](../app/dashboard/val-design.css#L891), [progress:637](../app/dashboard/val-design.css#L637), [NavigationPending](../components/ui/navigation-pending.tsx). No route-wide enter/exit choreography found. |
| Switch | Thumb transform and color changes use 140 ms in global CSS; dashboard checked position is overridden to 18 px. | [globals.css:2180](../app/globals.css#L2180), [val-design.css:198](../app/dashboard/val-design.css#L198). Native checked state remains the state signal. |
| Shared mobile sheet | Entry is sampled CSS spring motion: 500 ms, `linear` interpolation between samples, 32 px initial translation. Desktop shared dialog has no corresponding entry animation. Closing unmounts the surface. | [mobile.css:181](../app/dashboard/mobile.css#L181), [samples:603](../app/dashboard/mobile.css#L603), [DialogSurface](../components/ui/dialog-surface.tsx). No drag-to-dismiss or velocity handoff exists. |
| Channel expand/collapse | Chevron rotates with `transition-transform duration-200`; voice presence expands `grid-template-rows` and opacity over 200 ms. | [channel-list:315](../components/groups/channel-list.tsx#L315), [voice-channel-presence:18](../components/groups/voice-channel-presence.tsx#L18). Presence component returns null when empty. |
| Branded loader | Indeterminate track translates over 1.8 s, `ease-in-out`; labels and `role=status` remain visible. | [ValLoadingScreen](../components/brand/ValLoadingScreen.tsx), [globals.css:2914](../app/globals.css#L2914). The supplied logo is not animated/redrawn by this proposal. |
| Skeletons | Shared shimmer: 1,750 ms `cubic-bezier(.45,0,.2,1)` transform. Music search: 1.2 s alternating opacity pulse. | [pinned-message loader](../components/chat/realtime-message-panel.tsx#L691), [moderation loader](../components/groups/moderation-reports-panel.tsx#L125), [music.css:98](../components/music/music.css#L98). |
| Call invitation pulse / joining spinner | `motion-safe:animate-ping` in incoming and friend-call panels; `animate-spin` in voice join button. | [incoming-call-watcher:381](../components/calls/incoming-call-watcher.tsx#L381), [friend-call-room:286](../components/calls/friend-call-room.tsx#L286), [voice-channel-join-button:143](../components/groups/voice-channel-join-button.tsx#L143). Dashboard reduced-motion cascade can suppress animation. |
| Guided tour | `motion-safe:transition-all` on a rectangle whose top/left/width/height follow the target; width transition for progress. | [onboarding:519](../components/onboarding/dashboard-onboarding-coordinator.tsx#L519). Desktop spotlight only; mobile uses a different composition. |
| Functional audio visualization | Call canvases draw real audio levels outside React, sampling at most every 100 ms; speaking state has a 400 ms hold. Profile mic test updates React level state each animation frame and a width-based bar. | [use-call-activity](../components/calls/use-call-activity.ts), [voice settings:219](../components/profile/voice-audio-settings-panel.tsx#L219). These are data-driven meters, not decorative oscillation. |
| Scroll behavior | Root CSS declares smooth scrolling. Jump-to-latest and message search/reply use explicit JS `behavior: 'smooth'`. Hash scroller retries at 0/120/360/720 ms plus one animation frame. | [realtime-message-panel:475](../components/chat/realtime-message-panel.tsx#L475), [message-list:632](../components/chat/message-list.tsx#L632), [hash scroller](../components/layout/dashboard-hash-anchor-scroller.tsx). |
| Public landing | Floating mockup, message entrance loop, voice-dot shadow pulse and theme-card hover. | [app/page.tsx](../app/page.tsx), globals keyframe index in Appendix B. These are public presentation effects, not chat/call state. |
| Legacy command dock | Staggered entrances, glow/vein pulses, overshooting focus curve, breathing button, gesture activation and vibration remain in source. | [dashboard-sidebar](../components/layout/dashboard-sidebar.tsx#L632), `globals.css:7585-8060`. Current mobile CSS hides the entire old sidebar (`mobile.css:52`); dock is `sm:hidden`. Do not treat it as the current mobile navigation or revive it. |
| Historical decoration | Vector/crystal loader families have no TSX consumer found; live-background pseudos are explicitly `display:none !important`; `val-command-idle` has no animation declaration using it. | [globals.css:218](../app/globals.css#L218), [4378](../app/globals.css#L4378), Appendix B. Retain outside migration scope unless separately authorized. |

**Existing spring precision:** the sheet comment specifies `m=1`, `k=300`, `c=30`. Its damping ratio is approximately 0.866 (`c / (2*sqrt(m*k))`), so its spatial curve is slightly underdamped, not critically damped. The samples reach about -0.136 px before snapping to exactly zero at the last sample. The opacity curve is separately described as critically damped. This is a small source-confirmed overshoot, not evidence of visibly excessive bounce. `linear` here interpolates spring samples; it is not uniform-speed travel across the whole sheet motion. A fixed entry keyframe is not a gesture spring with interruptible velocity/state continuity.

### Gestures, commitment, and button activation

| Interaction | Source-confirmed behavior | Gap or preservation requirement |
| --- | --- | --- |
| Message long press / swipe reply | Touch-only on mobile; ignores interactive descendants, pending IDs, and 24 px OS edges. Hold opens actions after 450 ms. Movement beyond 8 px cancels hold; left tracking starts beyond 10 px with vertical movement under 24 px; translation clamps at -72 px. Release commits at -64 px with vertical/edge checks in `isReplySwipe`. | Preserve text selection, native vertical scroll, pinch zoom, and explicit action button. Tracking only writes while the original leftward condition is true: reversing past -10 px can leave the previous transform until release. No distinct engage/disengage hysteresis, velocity rule, pointer-ID ownership, or lost-capture handler in this row. Test, do not infer smooth reversal from its use of transforms. [message-list:257](../components/chat/message-list.tsx#L257), [mobile-navigation:23](../lib/mobile-navigation.ts#L23). |
| Home section reorder | Dedicated handle; pointer capture; transform tracks pointer; list reorders at item centers; compensates transform after React reflow. 6 px reorder deadband. Auto-scroll uses a 56 px edge zone and 10 px per animation frame. Space/Enter, arrows, Escape, Tab, live announcements, cancellation and storage warning are implemented. | Strong existing direct-manipulation base. Frame-based scroll distance varies with refresh rate. Repeated layout reads and simultaneous pointer/frame updates need measurement. No inertial coast is needed. [mobile-home-sections](../components/mobile/mobile-home-sections.tsx). |
| Floating music position | Pointer capture, direct tracking outside React, viewport clamping, resize/visualViewport reconciliation; arrows move 10 px or 40 px with Shift. Pointer cancel/lost capture end the drag at the current position. | Preserve keyboard positioning and viewport boundaries. `left`, `top`, `maxHeight`, `offsetWidth/Height` are used during movement. No momentum or spring. No Escape restore to drag origin. [use-player-position](../components/music/use-player-position.ts). |
| Music seek and volume | Native range inputs. Seek previews locally, commits on pointer up/key up/blur, cancels on pointer cancel, and disables while pending. Volume updates locally. Queue has native HTML drag/drop and explicit move/remove buttons. | Preserve exact numeric control, keyboard equivalents and server-authoritative seek/queue result. Do not add magnetic detents or delayed volume tracking merely because the research suggests them. [music-player:12](../components/music/music-player.tsx#L12), [queue:87](../components/music/music-player.tsx#L87). |
| Push-to-talk | Press activates; release, cancel, capture loss, blur, visibility loss and keyboard release mute. Late capture respects mute intent. | This is an appropriate hold interaction. Do not route it through generic click delays or confirmation motion. [use-push-to-talk](../components/calls/use-push-to-talk.ts), [controls:168](../components/calls/call-workspace.tsx#L168). |
| Legacy command interaction | Hold delay 210 ms; 10 px drag activation; 48 px proximity hit radius. Short pointer release opens the dock; keyboard toggles it; selection can occur on release near an action. | Hidden in current composition. Constants are local, and proximity selection/hit geometry differs from normal click. Not a template for new controls. [sidebar:82](../components/layout/dashboard-sidebar.tsx#L82), [hold:883](../components/layout/dashboard-sidebar.tsx#L883). |
| Ordinary controls | Primarily native `onClick`, links, form submission and checked inputs. Press styling varies between common 1 px dashboard depression, earlier 2 px diagonal rules, and music-specific controls. | Preserve native activation/cancellation. Transforming the actual button can move its hit-test geometry; an inner visual layer is a future option, not permission to change dimensions. Audit cascade before standardizing. |
| Destructive actions | Delete Space, leave Space and delete channel are direct POST submit buttons. Space deletion has consequence text but no separate confirmation interaction. Music queue clearing already has a two-button confirmation. | High-consequence actions have less deliberate commitment than the low-consequence legacy command hold. Propose accessible confirmation only where warranted; no universal long press. [Space settings:317](../app/dashboard/groups/[groupId]/settings/page.tsx#L317), [channel delete:269](../components/groups/channel-list.tsx#L269), [queue clear:109](../components/music/music-player.tsx#L109). No account-deletion flow was identified for this audit; it is a future example, not an existing feature. |

### Dialogs, sheets and navigation

`DialogSurface` supplies a title, modal role, focus trap/restoration, Escape/outside-pointer close, and scroll-bounded content. On mobile it also makes background siblings inert and integrates a history marker so browser Back dismisses the sheet. It coordinates same-origin link navigation after closing. Preserve these behaviors, including cleanup on replacement/unmount. The backdrop currently dismisses on pointer down, whereas most commands activate on click/release.

Shared consumers include channel search, pinned messages, poll creation, composer tools/emoji, new-message chooser, mobile message actions/reports, mobile channels, and mobile call controls. Desktop message actions/reports, sidebar popovers, incoming-call alert dialog, onboarding, participant audio popovers and the nonmodal music player have separate ownership/lifecycles. Music intentionally uses `aria-modal=false`; unifying timing must not make it modal or stop playback. No shared dialog exit-presence controller or drag-dismiss implementation exists.

Navigation relies on Next `Link`/router and segment loading boundaries. `NavigationPending` is local and `aria-hidden`; mobile links can portal a branded content-covering loader after 150 ms. `ChannelRoutePrefetcher` starts prefetch after 120 ms. Route fallback components share loading primitives but do not reserve each destination's precise content geometry. Active mobile navigation follows path/context; selection is not speculative server success. The installed Next loading guide confirms interruptible navigation and persistent shared layouts: retain that behavior, without waiting for an exit animation.

### Messaging: action is already separate from completion, but not visibly enough

1. Valid send creates a local `pending:<uuid>` object before fetching device keys, encrypting or posting. The composer clears immediately; the user can type another draft. This existing optimistic ordering should be preserved.
2. **The message row does not display its `pending: true` property as a Sending label, busy state, or delivery marker.** The only pending-ID check in `MessageList` excludes it from mobile gestures. Pending rows can otherwise resemble confirmed messages, and the toolbar does not share that guard. `val-message-status` is sender presence, not delivery status. Do not relabel it as a receipt. [send path](../components/chat/realtime-message-panel.tsx#L247), [row](../components/chat/message-list.tsx#L250).
3. POST success removes the local row and inserts the server message into encrypted state; decryption updates the visible list asynchronously. ID-based merging deduplicates server messages, but the pending ID differs. A temporary duplicate if SSE wins, a gap while decrypting, timestamp reorder, or remount on acknowledgement is a **risk to reproduce**, not a measured bug. [decrypt effect](../components/chat/realtime-message-panel.tsx#L112), [merge](../components/chat/realtime-message-panel.tsx#L575).
4. Failure removes the pending row and restores content ahead of any newer draft, preserving the newer text and restoring the reply target when possible. A localized alert says it is back in the composer. This preserves text, but changes the draft, removes the row, and provides no per-message failed/retry state. Concurrent failures may accumulate into one draft and exceed its limit. Pending rows are local to the route component; only draft text lives in the shared memory store.
5. Drafts are isolated by account/channel and live for the signed-in dashboard lifetime; the store bounds entries to 80. They do not survive reload/logout. Do not describe this as durable offline sending. Encryption initialization currently disables the textarea as well as Send; an already prepared composer is not disabled merely because SSE reconnects. [draft store](../lib/message-drafts.ts), [composer](../components/chat/realtime-message-panel.tsx#L504).
6. Reactions, pins and votes await HTTP results; local busy state prevents re-entry and errors are localized. Poll creation has its own guarded pending state and retains fields on failure. These are not optimistic operations today. A lightweight response can be added without fabricating a successful count or vote.
7. Feed follows the bottom only while near it (80 px threshold), otherwise offers Jump to latest. New rows do not intentionally steal an older-history reader's scroll. Preserve this. Errors/reply bars/composer row growth can change feed height and need scroll-anchor testing.

The POST schema and Prisma Message model have no client operation ID/idempotency field. A timeout does not prove a message was not persisted. A future retry UI must not silently add automatic resend or claim exactly-once delivery. Stable visual identity can be improved locally; full cross-transport correlation before a POST response requires a separately assessed contract. No schema change is made or assumed here.

### Call, voice and music state certainty

| Area | Good current behavior | Inconsistency / gap |
| --- | --- | --- |
| Join | Voice lobby requires explicit join; supports joining muted; immediate `isJoining` response and errors. Sidebar join starts the persistent session and then navigates. Friend calls have incoming/joining/unavailable states and ended-call guards. | Token/settings fetching and transport connection use different pending lifetimes. `startCall` returns before its async connection finishes; token success is not media success. |
| Session continuity | Call provider and remote audio survive route changes/popout. ICE disconnection retains peer objects; failed ICE triggers restart, sustained disconnection schedules restart after 5 s. Initial connection failure retains `activeCall` and an error surface. | Public media state is only `disconnected / connecting / connected / failed`; no explicit `reconnecting` variant. Peer disconnection often reads “Connecting media,” while the session may still say “connected.” |
| Meaning of connected | `MediaClient` sets connected after signaling subscription/presence; peer `connectionState` is separately exposed. Workspace also shows connected-peer information. | Header/live badge and session duration can imply more than signaling readiness. Neither server invitation ACCEPTED nor signaling subscribed guarantees audible remote media. Empty group rooms also legitimately have no peers. |
| Mic/camera/share | Local mic track changes immediately before broadcast acknowledgement. Camera/share state derives from actual tracks. Per-source busy guards and permission errors exist; capture generation protects against late permissions after leave. PTT release protects mute intent. | A failed signaling announcement must not be represented as failure to mute locally or cause an unmute rollback. Disable/retry wording should distinguish capture, local state and remote propagation. |
| Leave | Hardware is released before network cleanup. Friend-call server end failure reports “You left locally…” after local exit. Terminal server statuses end the call. | Preserve immediate privacy-sensitive stop. “Heavy” must not delay mic release or call exit. Status-poll errors currently only log; they do not tear down the session. |
| Invitation failure | Incoming overlay has visual controls, ringtone mute, busy/error feedback; active calls are separate. | Both incoming-watcher and friend-call-page decline paths await fetch without checking `response.ok`; an HTTP error can be treated as decline success. Initial status fetch failure on the friend-call page is mapped to “Call no longer available,” conflating reachability with terminal state. [watcher:257](../components/calls/incoming-call-watcher.tsx#L257), [room:136](../components/calls/friend-call-room.tsx#L136). |
| Music request state | Last session snapshot is retained during refresh errors. Reconnecting/error state, coalesced 3 s visible polling, online refresh, version checks and command IDs exist. Commands have a 20 s timeout and busy guard. Music error boundary does not own voice transport. | Playback/queue updates are server-authoritative, not optimistic. Reconnecting disables room controls. Status text is “Connecting”; no common operation-state vocabulary across the app. |
| Local music playback | Local volume/mute/pause, autoplay-blocked state and Join to listen/Retry player are distinct from shared session playback. Minimization retains the playback component. | “Playing together” is based on session state with blocked/error/local-pause exceptions; iframe buffering is not a distinct shared feedback state in the inspected UI. Keep local playback truth separate from room command acknowledgement. |

### Profile, loading, failure and offline behavior

- Profile photo previews respond locally, validate type/size, and submit through the existing form. `SubmitButton` exposes `aria-busy` and pending text using `useFormStatus`; many consumers use URL-action POST/GET forms. The pending behavior for those native submissions needs browser verification; component markup alone does not establish that every path provides local acknowledgement. `PeopleAction` explicitly owns a pending ref/state and call-start error.
- General profile preferences update locally, write `localStorage` in an effect, and show Saved for 1,200 ms. The storage write is unguarded and Saved is triggered before verified persistence. Voice settings have local cache/application plus saving/saved/error states and a 180 ms debounce. The debounce cancels the previous timer but retains only the latest patch, so rapidly changing different fields can drop an earlier unsent patch; full server responses can overwrite newer local edits. These are source-based reconciliation risks for targeted reproduction. [general preferences](../components/profile/profile-settings-panel.tsx#L102), [voice save](../components/profile/voice-audio-settings-panel.tsx#L319).
- Sidebar notification read state is optimistic, persists a snapshot and sends a POST without checking response status; rejection is swallowed. The mobile notifications page instead awaits success and shows errors. Both coexist. A consistent feedback layer must preserve responsiveness and make failure honest. [sidebar:463](../components/layout/dashboard-sidebar.tsx#L463), [mobile notifications](../components/mobile/mobile-notifications.tsx#L16).
- Chat encryption/pins, music search/player, media permissions and moderation have localized loading/error UI. Dashboard route errors use a larger retry surface. Loading screens expose labels; mobile delays avoid flashing on sufficiently fast navigation, but can cover retained content after 150 ms. A loader is not a completion state.
- The mounted shell shows an offline notice based on `navigator.onLine`; this is only a device connectivity hint, not proof each backend works. SSE reconnection and music refresh errors are separate. Service-worker offline navigation returns a public fallback with Try again. It neither queues sends nor caches conversations. Full navigation/reload can lose in-memory drafts; do not promise otherwise.

### Reduced motion, keyboard, sound and haptics

Existing protections include global 1 ms/one-iteration reduction, dashboard animation/transition suppression, sheet/music/loader-specific reduction, `motion-safe` invitation/tour utilities, visible focus, dialog focus management, range keyboard control, home reorder keyboard alternatives and call state labels/ARIA. Call meters use constant bar height under reduced motion while preserving level-derived color and spoken/text state elsewhere.

Gaps to verify:

- `.val-app * { transition:none !important }` has lower specificity than the important ID-scoped button/navigation shorthands. Global reduction can therefore be overridden. The hover/active transform rules also need computed-style checks at both breakpoints. Presence of a media query is not an accessibility pass.
- Explicit JS `behavior:'smooth'` does not defer to CSS `scroll-behavior:auto`; MDN distinguishes explicit smooth from auto. Centralize the JS policy too. [MDN scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#parameters).
- Profile mic test keeps React/width updates running; call canvas reduction does not stop its sampling loop. Decide which functional information should update and which spatial motion should reduce.
- Reconnecting chat text has no status/live role; pending message rows lack a status altogether. Common navigation's progress line is `aria-hidden`. Future feedback must be textual/programmatic as well as visual.

Sound/haptics already exist and must not be misreported as absent:

| Source | Existing behavior | Boundary |
| --- | --- | --- |
| Incoming call watcher | Web Audio sine ringtone: 740 Hz, gain envelope, 0.42 s tone, repeat every 1.8 s; gated by local `soundEnabled` and temporary ringtone mute. Optional vibration `[180,80,180]`. | Visual alert remains when audio is blocked. Vibration is not tied to a shared haptic preference; the effect can run again when mute/call dependencies change. No new sounds in this phase. |
| Legacy command dock | `navigator.vibrate`: focus 8 ms, open 12 ms, select `[18,24,28]`. | Capability check only; hidden legacy UI, not a global semantic adapter. |
| Service worker | Notification options use `silent:false`; incoming pattern `[250,100,250,100,450,150,450]`, other notifications `[90]`. | Worker does not read the profile's localStorage sound setting. Browser/OS delivery behavior remains unverified; app sound-off cannot be claimed to silence all system notifications. |
| Call/profile analyzers and YouTube | Audio contexts for measurement, media tracks and actual music playback. | These are product media, not interaction sound assets. Never mute/replace them through a decorative feedback setting. |

## Inconsistencies

| ID | Priority | Finding | Proposed direction |
| --- | --- | --- | --- |
| I-01 | High | Pending message is a data flag without visible delivery state; failure removes it and edits the draft. | Preserve immediate optimistic insertion; make pending/failed/confirmed explicit and maintain intent safely. |
| I-02 | High | Signaling-connected, invitation acceptance and audible peer media can share success-like language. | Derive separate, honest connection feedback without replacing transport state. |
| I-03 | High | HTTP decline errors, optimistic notification-read failures and preference persistence have inconsistent confirmation semantics. | Confirm only at the correct authority; show localized failure and retain local safety state. |
| I-04 | High | Delete Space/channel use direct submit; no deliberate confirm step. | Separate accessible confirmation for existing irreversible actions; keep server permissions unchanged. |
| I-05 | High | Reduced-motion cascade and explicit smooth scroll are not a coherent policy. | Verify computed styles; use a single semantic reduced-motion policy for CSS and JS. |
| I-06 | Medium | Timing/easing and pressed travel vary by CSS layer/component; no material inheritance. | Central tokens and named recipes; migrate only relevant motion declarations. |
| I-07 | Medium | Mobile sheet entry is sampled, slightly underdamped and mount-only; other surfaces appear/disappear by unrelated lifecycles. | Shared structural entry/settle rules with immediate interruptibility and preserved focus/history. |
| I-08 | Medium | Swipe reversal has a discontinuous update condition; gesture cleanup/thresholds differ across features. | Explicit gesture ownership, engage/release/cancel rules; keep native scroll and alternatives. |
| I-09 | Medium | Native form, custom pending and route-cover feedback differ. | Audit each submission path before choosing a shared acknowledgement adapter. |
| I-10 | Medium | Rapid voice-setting edits can lose pending patches or accept stale responses. | Coalesce patches and reconcile per operation; do not merely animate Saved. |
| I-11 | Lower / deferred | Ringtone, worker notification vibration and hidden command haptics have separate policies. | Semantic optional adapters later; first phases add no audio assets or new vibration. |

## Performance risks

These are code-level risks, not measured browser performance results.

| Risk | Evidence | Proportionate future verification |
| --- | --- | --- |
| Layout work during continuous drag | Music writes `left/top/maxHeight` and reads element dimensions per pointer movement. | Trace a populated player drag; move visual travel to transform while preserving bounds and final placement. |
| Layout-affecting animation | Presence `grid-template-rows`; mic meter `width`; desktop onboarding top/left/width/height and progress width. | Distinguish continuous meter/drag cost from occasional expansion. Prefer transform for continuous motion; retain unavoidable final layout changes. |
| Read/write/reorder feedback loop | Home drag measures bounds, transforms, reorders React children, measures again; auto-scroll also updates each frame. | Trace variable-height sections while reversing and scrolling; use elapsed-time scrolling if migrated. Preserve successful compensation. |
| Paint-heavy effects | Shadows, filter/blur, border radius, SVG stroke dash offsets, and historical background-position animation. | Inspect only mounted/reachable effects first. Dormant code is not current frame cost. No blanket removal of visual depth. |
| Possible message layout discontinuity | Pending/server IDs differ; async decrypt replacement; failure removes row; composer/reply/error regions resize. | Slow send/POST/SSE reorder tests with scroll anchor and draft assertions, plus browser recordings. |
| State-dependent geometry | Offline notice reserves new shell height; keyboard updates viewport; call gallery/screen share and floating call/music surfaces change composition. | Test intended reflow versus accidental jumps with keyboard, zoom, safe areas, large text and simultaneous call/music. Do not label every intentional layout change as CLS. |
| Repeated hash scrolling | Scheduled retries can pull the viewport back after manual input. | Navigate to profile hash, scroll before delayed attempts, and test focus. Cancel obsolete attempts in a future change. |
| Unstable hit geometry | Press transforms act on buttons/links; reply gesture changes left border width; labels switch to pending text. | Verify target boxes throughout press and busy transitions. Preserve current dimensions; reserve status/label space where needed. |
| Unnecessary updates | Profile mic test can rerender its parent each frame; generic transitions can animate future properties unintentionally. | Profile rendering and use property allowlists. Audio samples are not UI easing tokens. |

## Good existing behavior to preserve

- Immediate local message insertion before network/encryption completion, editable next draft, and recovery that does not overwrite newer draft text.
- Memory-only, account/channel-separated drafts and current privacy/storage boundaries.
- Message decryption cache, memoized rows, ID-based server merge, bottom-follow intent and Jump to latest.
- Persistent call/audio ownership across routing, explicit join, optional muted join, independent media controls, late-capture cancellation, PTT release safety, and hardware cleanup before network work.
- Peer retention during transient ICE disconnection and existing restart mechanisms; do not replace recoverable calls with whole-page spinners.
- Music version/room guards, coalesced refresh, local playback controls, preserved player across minimize, and accessible queue actions/confirmation.
- Shared dialog semantics, focus restoration, mobile inert background and Back behavior.
- Home reorder cancellation, keyboard control, announcements and honest local-storage failure warning.
- Visual viewport handling that avoids overriding pinch zoom; intentional mobile composition and native scrolling.
- Existing error/status labels, focus styles, reduced-motion intent, public-only offline cache and server authorization.

## Interaction Physics opportunities

1. Introduce semantic recipes above the existing components/transports. Store tunable motion and gesture values centrally; keep media/network deadlines separate.
2. Fix certainty before increasing motion: pending message visibility, truthful failure, local-versus-server settings and call/media state, and deliberate destructive confirmation.
3. Standardize control press, sheet entry/exit and loading acknowledgement while preserving geometry, palette, typography, hierarchy, approved logo and mobile/desktop layouts.
4. Make gesture reversal/cancellation explicit and migrate continuous layout writes only where evidence warrants it.
5. Treat reduced motion as a complete alternate behavior policy, including JS scroll and state announcements.
6. Reserve semantic sound/haptic roles as inactive extension points. Existing ringtone and product media remain owned by their current systems.

The [v1 document](doshab-interaction-physics-v1.md) defines the proposed material model, token architecture, acceptance criteria and implementation stages. None of those stages beyond this audit has begun.

## Files inspected

The register distinguishes targeted inspection from the full source search. References above provide relevant line anchors; generated/dependency source was excluded except for framework documentation/default-token checks.

| Area | Targeted files |
| --- | --- |
| Request/reference/framework | `AGENTS.md`, `package.json`, `VAL_ARCHITECTURE_REPORT.md` (orientation sections), supplied pasted request and research PDF; installed Next `01-app/01-getting-started/04-linking-and-navigating.md`, `01-app/03-api-reference/03-file-conventions/loading.md`; `node_modules/tailwindcss/theme.css` |
| CSS | `app/globals.css`, `app/dashboard/val-design.css`, `app/dashboard/mobile.css`, `components/music/music.css` (all motion declarations/keyframes indexed; relevant cascade blocks inspected) |
| Shell/navigation/loading | `app/layout.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/error.tsx`; `components/layout/{dashboard-sidebar,dashboard-shell,people-rail,val-viewport,dashboard-hash-anchor-scroller}.tsx`; `components/ui/{dialog-surface,navigation-pending,submit-button,loading-states,button-link}.tsx`; `components/brand/ValLoadingScreen.tsx`; route `loading.tsx` imports |
| Messaging | `components/chat/{realtime-message-panel,message-list,message-input,message-drafts-provider}.tsx`; `components/messages/messages-page-client.tsx`; `lib/{message-drafts,chat-presentation,message-bus}.ts`; `types/index.ts`; `app/api/channels/[channelId]/messages/route.ts` (send contract and stream) |
| Mobile | `components/mobile/{mobile-shell,mobile-home-sections,mobile-page-loading,mobile-space,mobile-notifications,mobile-create-space,mobile-profile,mobile-navbar-preferences,mobile-navbar-settings,mobile-search}.tsx`; `lib/{mobile-navigation,mobile-home-order,mobile-navbar,viewport}.ts` (helpers/search/tests) |
| Calls/media | `components/calls/{persistent-call-provider,call-workspace,friend-call-room,incoming-call-watcher,mobile-call-controls}.tsx`; `components/calls/{use-push-to-talk,use-call-activity,use-call-wake-lock}.ts`; `components/voice/{voice-room,lazy-voice-room}.tsx`; `lib/media/{media-client,types,call-view}.ts` |
| Music | `components/music/{music-session-provider,music-player,music-button,listen-together-popover,music-search,youtube-playback}.tsx`; `components/music/{use-player-position,music-volume}.ts`; `lib/music/refresh.ts`; music state/server behavior through existing tests |
| Profile/forms/social/overlays | `components/profile/{profile-form,profile-settings-panel,voice-audio-settings-panel}.tsx`; `components/groups/{channel-list,channel-route-prefetcher,voice-channel-presence,voice-channel-join-button,create-group-form,create-channel-form,invite-friend-form,moderation-reports-panel}.tsx`; `components/friends/friend-search-form.tsx`; `components/requests/requests-and-invites-section.tsx`; `components/notifications/push-notification-toggle.tsx`; `components/onboarding/dashboard-onboarding-coordinator.tsx`; theme components (consumer search) |
| Consequences/offline | `app/dashboard/groups/[groupId]/settings/page.tsx`; group/channel delete and group leave route permission/mutation searches; `prisma/schema.prisma` (Message, MusicSession, FriendCall and status definitions); `public/push-sw.js`, `public/offline.html` |
| Baseline tests | `tests/chat-presentation.test.mjs`, `tests/mobile-experience.test.mjs`, `tests/media-client.test.mjs`, `tests/music-session.test.mjs` |

## Verification and limits

- Ran `node --test tests/chat-presentation.test.mjs tests/mobile-experience.test.mjs tests/media-client.test.mjs tests/music-session.test.mjs`: **55 passed, 0 failed, 0 skipped**, exit 0. These are helper/mocked/source-level tests, including media lifecycle and music concurrency cases; they do not prove real RTP, browser rendering, touch latency or accessibility.
- Used `rg` source-wide scans, targeted source reads, PostCSS parsing of all four CSS files, import/consumer searches, current Git state and the installed Next.js guides. The audit accounts for all 30 custom keyframe definitions and all CSS motion declarations in those four files, including dormant ones.
- Markdown source-path/line references, code-fence balance and whitespace checks passed. All 30 custom keyframe names are present in the inventory; all 13 requested material properties and five mass families are present in the proposal. Final Git status shows only the two requested new documents added by this task; pre-existing changes remain.
- Lint, typecheck and application build are not run for these two Markdown-only additions. No executable source, dependencies, schema or configuration changed. No new tests are authored for the documentation.
- No authenticated browser session, live backend mutation, real-device measurement, computed-style capture, performance trace, screen-reader run, live push delivery or multi-device call was performed. Layout/performance risks and cascade effects need that later verification. No numerical perception target is claimed as achieved.
- No user action is required to use the audit. Implementation requires a subsequent request; the proposal is a reviewable plan, not authorization to execute it.

## Appendix A: CSS transition declaration index

This is an exhaustive declaration-site index for CSS transitions in application styles, grouped where declarations are identical. It includes overridden/legacy declarations. Tailwind utilities and JS motion are listed separately above. Durations here are **observed source values**, not approved v1 targets.

| File / lines | Selector or family | Declared behavior |
| --- | --- | --- |
| `globals.css:1027` | body | background/color 140 ms ease |
| `globals.css:1121` | app row | background/border/shadow/transform 150 ms ease |
| `globals.css:1167,1225,1637,2603` | page/global/popover/feed scrollbar thumb | background 200 ms ease |
| `globals.css:1353` | landing theme card | border/shadow/transform 160 ms ease |
| `globals.css:1719,1742` | nav icon; nav avatar | icon background/border/radius/shadow/color/transform 150 ms ease; avatar radius 150 ms ease |
| `globals.css:1919` | icon button | background/border/radius/shadow/color/transform 140 ms ease |
| `globals.css:2026,2073,2110` | primary/secondary/danger button | background/border/shadow/color/transform 140 ms ease |
| `globals.css:2195,2215` | switch and thumb | background/border 140 ms; thumb background/transform 140 ms ease |
| `globals.css:2324-2325` | all links/buttons/inputs/textareas/selects | duration 150 ms; timing ease; no property allowlist here |
| `globals.css:2352` | global reduced motion | duration 1 ms important |
| `globals.css:2425,2442,2658` | theme toggle segment, pseudo, option | 140 ms ease; control properties, pseudo opacity, option background/color respectively |
| `globals.css:2615` | message-feed article | background/border 140 ms ease |
| `globals.css:2724` | theme preview | border/shadow/transform 180 ms ease |
| `globals.css:3269` | themed fields | background/border/shadow/color 150 ms ease |
| `globals.css:3513,3550` | sidebar icon and pseudo | background/border/shadow/color/transform 160 ms; pseudo background/shadow/opacity/transform 160 ms ease |
| `globals.css:5119` | themed shared buttons | background/border/shadow/color/transform 140 ms ease |
| `globals.css:6993,7086` | channel pill; themed fields | border/shadow/color/transform 140 ms ease |
| `globals.css:7337,7359` | command action and pseudo | action border/background/shadow/color/transform 150 ms; pseudo opacity/transform/filter 150 ms ease |
| `globals.css:7721` | command-dock action | border/background/shadow/color/transform 100 ms ease-out important |
| `val-design.css:63` | dashboard shared buttons | background/border/transform .15 s ease important |
| `val-design.css:168` | dashboard reduced motion | transition none important |
| `val-design.css:615,630` | people toggle; people actions | background/border 140 ms; background 140 ms; omitted easing uses CSS default |
| `val-design.css:909` | final dashboard nav icon | background/color/border 140 ms ease important |

`mobile.css` and `music.css` contain no explicit `transition` declarations. Music controls can still inherit global control transition duration/property behavior. Tailwind's installed default is 150 ms and `cubic-bezier(.4,0,.2,1)`; utility-generated rules are distinct from the unlayered custom overrides. Explicit utility variants are `duration-200`, `transition-transform`, `transition-[grid-template-rows,opacity]`, `transition-[width]`, `motion-safe:transition-all`, `animate-spin`, and `motion-safe:animate-ping`. Generic `transition` occurs throughout forms, buttons, rows, fields, theme UI and public/auth pages; it does not imply a semantic family.

## Appendix B: every custom keyframe family

All paths below are application CSS. Grouped names still enumerate each definition. Most duration/delay declarations are in `globals.css`; final reachability is noted, not assumed.

| Definitions (file:line) | Duration/easing/delay declarations | Properties and status |
| --- | --- | --- |
| `val-command-rise` (`globals:927`) | 180 ms ease; action delays 10/30/50/70 ms | opacity/transform; older command entrance, overridden/hidden |
| `doshab-landing-float` (`globals:1391`) | 7 s ease-in-out infinite | transform; landing consumer |
| `doshab-landing-voice-pulse` (`globals:1401`); `doshab-landing-voice-pulse-theme` (`globals:4263`) | 2.4 s ease-in-out infinite | box-shadow; themed rule supersedes base on themed root |
| `doshab-landing-message-in` (`globals:1411`) | 4.8 s ease-in-out infinite; optional 1.4 s delay | opacity/transform; landing consumer |
| `app-shimmer` (`globals:2278`) | 1,750 ms cubic-bezier(.45,0,.2,1) infinite | transform; pinned/moderation skeletons |
| `doshab-live-background-drift` (`globals:2284`); `doshab-live-background-pan` (`globals:2293`) | 18 s ease-in-out alternate; 26 s linear | transform; background-position; pseudos hidden by themed-root rule |
| `val-loading-progress` (`globals:2919`) | 1.8 s ease-in-out infinite | transform; current branded loader |
| `doshab-vector-spin` (`globals:3003`) | 3,200 ms linear infinite | transform; historical loader, no TSX consumer found |
| `doshab-vector-draw` (`globals:3009`) | 2,200 ms cubic-bezier(.72,0,.24,1); curl/stem delays 120/180 ms | opacity/stroke-dashoffset; historical |
| `doshab-vector-pop` (`globals:3023`) | 2,200 ms same curve; leaf delays 90/180 ms | opacity/transform; historical |
| `doshab-vector-float` (`globals:3037`) | 2,200 ms ease-in-out; shard delays 150/300/450 ms | opacity/transform; historical |
| `doshab-crystal-burst` (`globals:3188`); `doshab-grape-crystallize` (`globals:3202`); `doshab-leaf-open` (`globals:3216`) | 2,600 ms cubic-bezier(.72,0,.24,1); grape delay from `--grape-delay` | opacity/transform; historical |
| `doshab-crystal-sway` (`globals:3230`); `doshab-shard-float` (`globals:3244`) | 2,600 ms ease-in-out; stem reverse; shard delays 0/180/360/540 ms | opacity/transform; historical |
| `val-command-idle` (`globals:4962`) | no animation use found | transform; dormant definition |
| `val-command-backdrop-in` (`globals:7955`) | 160 ms ease-out | opacity; legacy command backdrop |
| `val-command-bottom-bloom` (`globals:7965`) | 220 ms cubic-bezier(.22,1,.36,1) | opacity/transform; legacy |
| `val-command-vein-grow` (`globals:7977`) | 220 ms same curve; index * 34 ms stagger | stroke-dashoffset; legacy |
| `val-command-vein-pulse` (`globals:7983`); `val-command-vein-focus-pulse` (`globals:7994`) | 1.7 s / 1.25 s ease-in-out infinite; 240 ms + index * 34 ms delay | opacity; legacy |
| `val-command-item-rise` (`globals:8005`) | 180 ms cubic-bezier(.22,1,.36,1); 44 ms + index * 42 ms delay | opacity/filter/visibility; legacy |
| `val-command-drag-focus` (`globals:8018`) | 190 ms cubic-bezier(.2,1.2,.28,1); zero delay | filter/transform, scale overshoot; legacy, transform-important overrides also exist |
| `val-command-button-breathe` (`globals:8035`) | 3.4 s ease-in-out infinite | transform/box-shadow; legacy button also explicitly disables animation |
| `val-navigation-progress` (`val-design:639`) | 1 s ease-in-out infinite alternate | scaleX; local navigation pending |
| `val-mobile-sheet-spring` (`mobile:605`) | 500 ms linear sampled curve | transform/opacity; mobile shared sheets |
| `music-pulse` (`music:101`) | 1.2 s ease-in-out infinite alternate | opacity; music search skeleton |

Animation suppression/reduction declaration sites: `globals.css:936,2350-2351,2920,4731,4913,4941,4975,5256,7938,8060`; `val-design.css:168,224,648`; `mobile.css:628`; `music.css:102`. This index includes obsolete definitions to make later targeted migration possible; it is not a cleanup request.
