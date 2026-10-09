# Doshab Interaction Physics v1

Status: proposed specification and staged implementation plan. Date: 2026-10-06. **Documentation only; no implementation has been performed.**

This proposal is grounded in the [current interaction audit](doshab-interaction-audit.md), at repository HEAD `3a844ad4cf1d1932237d145b356c52e92f7bddfb` plus the inspected working tree. VAL's existing appearance, layout, information architecture, product features, database and transports are preserved. Interaction Physics governs response and continuity above those systems.

## Philosophy

VAL should feel **heavy, fast and precise; safe, strong and controlled**. Weight comes from clear activation, stable boundaries, decisive movement and exact rest. It does not come from waiting, artificially delayed requests, excessive resistance, visual bulk, or decorative bounce.

An input gets immediate local acknowledgement. Completion comes from the authority that can establish it: local control state, successful storage, server response, captured media track, or actual connection evidence. A pressed button is not a successful request; an accepted call invitation is not connected audio; a locally rendered message is not a delivery receipt.

Critical rest is the structural default. Small elasticity may communicate a real boundary or intentional soft interaction, but must be justified per recipe. Users can reverse or cancel direct manipulation and start a new action without waiting for decorative motion. Reduced motion, silent devices, absent haptics, keyboard use and assistive technology receive the same certainty.

### How the research is used

The supplied *Software Material Perception Research Metaplan.pdf* is a source of design hypotheses, not executable instructions or independent validation of its claims.

| Research direction | v1 decision |
| --- | --- |
| Separate response from completion; preserve intent during failure | Adopt. Extend current optimistic messaging and persistent media ownership. |
| Critically damp every structural interaction | Use critical rest as the default design character; do not force a spring solver onto every control. The existing sheet is a sampled, slightly underdamped curve. |
| CRDT/local-first database or sync engine | Do not adopt. Keep existing React state, memory drafts, HTTP, SSE, Prisma and media systems. |
| Universal 16/20 ms response rules, numeric swipe velocities/distances, acoustic binding deadlines | Do not treat as universal truths or shipping thresholds. Measure local acknowledgement and frame pacing on target devices; maintain a central calibration record. |
| High-friction gestures for all destructive actions | Prefer explicit, accessible confirmation for existing irreversible actions. No mandatory long press/slide-to-confirm default. |
| Sounds for mute/join/sheets; initialize audio globally | No new sound assets or global audio initialization in the initial work. Define semantic hooks only. |
| Native-quality haptics or pointerrawupdate as a latency cure | Neither is a dependency. Use supported pointer events, sound-off/no-haptic fallbacks, and measured rendering performance. Raw input frequency cannot make expensive UI work free. |
| Magnetic volume detents, custom scroll rubber bands, route scaling, hit-stop/shatter effects | Not part of v1. Preserve exact native range controls, native scrolling, route composition and existing visual identity. |

The report's scientific evidence labels, product comparisons and perception numbers are unverified in this audit. No such number is a product guarantee.

## Material model

Material properties are semantic design constraints. They do not imply kilograms, real force, or one equation for all components.

| Property | Meaning | Representation / rule |
| --- | --- | --- |
| `mass` | Perceived consequence and structural weight | Family: LIGHT, STANDARD, STRUCTURAL, HEAVY, CRITICAL. Not a duration multiplier. |
| `stiffness` | How firmly travel follows a target/boundary | Named boundary/rest policy. Numeric solver stiffness only for a recipe that actually uses a solver. |
| `damping` | How movement settles | `critical-rest` default for structural movement; justified `bounded-elastic` exception; immediate state changes need neither. |
| `friction` | Effort needed to establish intent and resistance at a boundary | `minimal`, `normal`, `deliberate`, or `confirm`. Never a hidden delay on a normal tap or pointer tracking. |
| `activationThreshold` | Conditions separating observation, engagement and commitment | Named gesture/confirmation policy with pointer, keyboard and cancellation rules. A normal button inherits native click activation. |
| `travel` | Allowed visual displacement and axis | Named bounded CSS-pixel travel token; visual rest geometry and hit target remain fixed. Local range controls map directly to their value. |
| `snap` | Valid resting/commit positions | Existing origin/destination, item slot, viewport boundary or control endpoint. Do not invent intermediate states or navigation destinations. |
| `momentum` | What continues after release | None for buttons/reactions/destruction; bounded only when it helps an existing manipulation. Do not replace native scroll momentum. |
| `reversibility` | What can be undone, interrupted or cancelled | Distinguish visual reversal, pre-submit cancellation, local reversal and irreversible server mutation. Reversing an animation does not undo a committed request. |
| `latencyBehavior` | Feedback while completion is unresolved | Immediate acknowledgement, optional local preview, scoped pending, truthful authority and stale-response handling. |
| `failureBehavior` | What remains when work fails | Preserve input/surface; restore a known state or retain a labeled unresolved state; targeted retry only when safe. |
| `soundRole` | Optional state-correlated audio intent | `none`, `detent`, `latch`, `structural-join`, `warning`, `failure`; inactive extension point initially. |
| `hapticRole` | Optional tactile state intent | `none`, `selection`, `commit`, `warning`, `failure`; inactive extension point initially. |

A family supplies defaults; a recipe supplies action-specific semantics; the existing component supplies real state. Critical operations may use the same fast press motion as a standard button but require a separate confirmation. A LIGHT microphone toggle still belongs to a HEAVY call surface and must mute immediately.

## Mass families

| Family | Existing VAL examples | Character | Activation / movement | Completion and failure |
| --- | --- | --- | --- | --- |
| LIGHT | Reaction, checkbox, selection, preference toggle | Immediate, exact, low friction | Native activation; tiny or no travel; no coast; no bounce by default | Local state can be immediate; remote counts/preferences remain pending until their authority confirms. Reversible failure is localized. |
| STANDARD | Button, normal navigation link, context menu | Crisp response and decisive stop | Immediate press; commit on native click; short named settle; stable target | Pending belongs to action/link; preserve label space and surface. |
| STRUCTURAL | Shared sheet, channel/Space navigation, media panel | Clear spatial continuity and firm boundaries | Bounded transform/opacity where spatial motion is useful; critical rest; interruption accepted | Focus/history and content identity survive transitions. Loading cannot impersonate a destination. |
| HEAVY | Join/leave voice, start/end call, persistent call/music surface | Deliberate and certain, with fast local feedback | Explicit labeled control and stable placement; no generic dwell requirement. Stop/mute/leave never wait for motion | Separate local session, signaling and peer readiness; retain session during recoverable trouble. |
| CRITICAL | Delete Space/channel; an account-delete action only if separately introduced later | Consequence is explicit and hard to trigger accidentally | Accessible confirmation naming the target/consequence. Cancel remains clear; no destructive commit on pointer down, proximity, or slide velocity | Server-authorized mutation; no success until acknowledged; preserve failure context. No fabricated undo. |

No family changes colors, shadows, typography, border shape, control sizes, page composition, logo geometry, route names or permissions. Existing selected/hover/disabled visual vocabulary remains the starting point.

## Motion rules

1. Acknowledge locally in the input update path; aim for the next available paint and measure it. No artificial wait for a network response, spring, timer or audio unlock.
2. Keep interaction feedback and action scheduling independent. Submit/join/stop may run while visual feedback settles. Navigation remains interruptible as provided by Next.
3. Structural motion uses bounded travel, decisive acceleration, controlled deceleration and exact final rest. Initial resistance is communicated through the shape/boundary or explicit commitment, not by delaying input acknowledgement.
4. Prefer CSS for finite control/opacity transitions. Introduce runtime motion only where interrupted positional continuity genuinely needs it. No animation dependency is required by this proposal.
5. Gesture tracking has no catch-up easing between the pointer and the object. If an existing action needs release settling, start at the current position; retain velocity only where its recipe warrants it. Re-grabbing cancels/rebases the settle immediately.
6. Animate transform/opacity for continuous visual travel. A border/color state change may repaint briefly; this is allowed when it preserves meaning. Avoid continuous width/height/margin/top/left/grid-track animation. Final layout changes remain necessary for expanding content; do not confuse them with continuous animation.
7. Do not animate control geometry or hit areas during a press. A future inner visual wrapper can move while the semantic button stays put, provided resting geometry is unchanged.
8. Mount/exit effects never own call/audio teardown, message persistence, focus validity or route readiness. A reduced-motion or interrupted transition must not strand an unmount callback.
9. No global `transition: all`, generic global ease-in-out, universal 300 ms rule, mandatory stagger, idle breathing or sound accompanying every tap. Dormant legacy effects are not revived.
10. Structural rest endpoints are exact and stable. If using a numeric spring, choose/calibrate the solver and settle tolerance centrally. `c = 2*sqrt(m*k)` describes the chosen simple spring model, not a universal design law; semantic mass names do not directly enter that equation.

### Surface-specific policy

| Surface | Proposed motion contract |
| --- | --- |
| Button/toggle | Immediate pressed/checked feedback; stable box; keyboard activation mirrors pointer result; no spring needed. Local mute is authoritative immediately. |
| Shared sheet | Preserve current placement/dimensions. Entry and optional exit share named structural recipes. Close is accepted during entry; reopening never waits behind an exit queue. Keep focus/inert/Back lifecycle correct even with zero duration. |
| Navigation | Keep current persistent shell and existing destination identity. Use local pending feedback and segment fallback; no full-page slide/scale by default. Do not hold navigation until motion finishes. |
| Chat | Preserve row/scroll identity through pending acknowledgement. No replayed entrance on SSE echo, decrypt completion or every render. Failure state is local and does not evict newer typing. |
| Persistent call/music | Minimize/return retains the same session and audio owner. No animation-driven remount. Readiness labels reflect actual subsystem state. |
| Functional meters/loaders | Meters represent real data. Indeterminate activity is explicitly indeterminate, never a fake progress percentage. Reduced mode retains a static status/value. |

## Gesture rules

An existing draggable interaction should have an explicit lifecycle:

```text
idle -> observing -> engaged -> committed -> settling -> rest
          |            |           |
          +-> cancel <-+           +-> operation pending (only when needed)
                      |
                    return/rest
```

This is a design contract, not a requirement to introduce a global gesture state machine.

- Record the active pointer identity, primary-button eligibility and origin. Ignore other pointers; clean up on pointer cancel, lost capture, unmount and relevant visibility/focus loss.
- Give immediate local press acknowledgement while observing. Preserve native scroll/selection until intentional axis engagement. Keep OS edge gestures and pinch zoom available.
- Use named engage, commit and disengage conditions. Hysteresis means an engaged action has a stable release/cancel boundary rather than flickering at one threshold. Define `disengage < engage` only where it helps; every gesture need not use distance, duration and velocity together.
- Track reversals continuously, including when the pointer crosses back through the engagement threshold. Never leave the old transform frozen until release.
- Cancellation clears preview/armed state and produces the recipe's declared safe result. Home reorder restores original order; reply cancels without submitting; music reposition can remain at the last safe position as today unless an explicit cancel-to-origin behavior is later approved.
- Pointer capture and `touch-action` must be local to the intended gesture. The [Pointer Events specification](https://www.w3.org/TR/pointerevents3/) defines capture/cancellation and browser direct-manipulation ownership; follow those lifecycles rather than suppressing touch across the app.
- Direct manipulation remains direct in reduced motion. Remove optional release inertia/overshoot; retain tracking or provide the existing non-drag alternative. Do not detach the item from the pointer as an accessibility workaround.
- Preserve native seek/volume sliders, keyboard arrow/value behavior, explicit Reply/action buttons, keyboard home reorder and music queue move buttons. No task requires a long press, precise swipe or speed threshold as its only path.
- Keep auto-scroll time-based if adjusted; use elapsed time and bounded edges, not pixels per animation frame. Account for viewport/keyboard changes without changing the intended target beneath an active press.
- Push-to-talk is a safety-specific press/release interaction. Release must mute immediately, including during permissions and recovery. It is not a generic HEAVY confirmation gesture.

## State response rules

Keep three concepts separate rather than imposing one universal state enum on every component:

| Dimension | Vocabulary | Owner |
| --- | --- | --- |
| Interaction | idle, focused, pressed, observing, engaged, settling | Component/gesture adapter |
| Operation | local intent, pending, confirmed, failed, cancelled; outcome unknown where necessary | Existing action or request owner |
| Connection | existing transport state plus derived connecting, trouble, reconnecting, recovered, ended presentation | Existing SSE/media/music owner and a thin presentation adapter |

Not every action needs every state. A local checkbox can go directly from intent to confirmed; a remote mutation cannot. Display `pending` while work is running and `unknown` when the result cannot be established, rather than claiming that a timeout proved rejection.

| Existing operation | Immediate response | Confirmed means | Failure/recovery contract |
| --- | --- | --- | --- |
| Send message | Show a local row marked Sending; retain stable local identity and allow next draft | Server saved this message, not delivered/read by a person | Preserve row/content/reply intent with explicit failure or uncertain outcome. Safe local recovery must not duplicate or overwrite a newer draft. Retry requires correlation assessment. |
| Reaction/vote/pin | Acknowledge pressed/busy immediately | API accepted authoritative message update | Leave/restore known count/state and show localized error. Optimistic counts are optional later and require safe rollback. |
| Open sheet | Show the surface and meaningful focus state | Local open/closed state is committed | Interrupted animation cannot leave invisible focus traps or inert content. |
| Open channel/Space | Press/link pending immediately; keep shell | Route/content is usable for the requested destination | Keep retry/return path and current provider state; do not label the old screen as the new channel. |
| Join call | Joining label and local action guard | Distinguish invitation accepted, signaling joined, peer connecting, media connected; an empty group room is valid | Preserve the session surface, permission alternatives, and existing ICE retry. “Reconnecting” must correspond to active recovery, not cosmetic optimism. |
| Mute/unmute | Reflect actual local track enabled state immediately | Local capture is muted/unmuted; propagation state is separate | Failed broadcast must never unmute to roll back a locally successful mute. Unmute with no device remains pending/failed until a track is acquired. |
| Screen share | Pending while browser picker is active | A real local screen track is live | Picker cancel is localized; keep existing capture if replacement fails. Track end clears Sharing. |
| Leave/end call | Stop local tracks promptly and acknowledge left | Local leave and any server end acknowledgement are separate facts | Retain the existing “left locally” error path; never reactivate hardware because the server request failed. |
| Music command | Immediate pressed/busy; local seek preview | Existing versioned room command accepted | Keep last known session, identify connection trouble; local autoplay blocked/buffering/error is distinct from shared state. |
| General preference | Local checked/value response | Browser persistence succeeded | Show unsaved-for-this-visit if storage fails; do not claim Saved before persistence. |
| Voice preference | Apply/cache current local intent; Saving | Relevant server patch acknowledged | Merge unsent patches, reject stale responses, preserve newest intent and show unsaved state. |
| Delete Space/channel | Open consequence-specific confirm; submit pending only after explicit confirmation | Server-authorized deletion succeeded | Keep context and error; no fabricated undo, premature disappearance, or automatic destructive retry. |

### Identity, duplication and stale work

Reuse existing provider ownership and guards. An operation's result must match its channel/session/entity and current request generation before changing UI. Motion events must never dispatch mutations. A result must not resurrect an ended call, replace a newer setting, duplicate a message or announce success twice because both HTTP and realtime reported it.

Message visual continuity can use an in-memory local operation-to-server-ID mapping after acknowledgement. The current backend lacks a message idempotency/correlation field. Do not deduplicate by content/timestamp alone or promise exactly-once retries. A durable outbox or backend correlation change is a separate design decision with schema/API analysis; it is not silently included in v1. Music's existing command/version protocol should remain intact.

## Failure rules

1. Preserve the user's input and last useful surface. Local errors use existing status/error regions; do not replace the whole dashboard for a recoverable send, player, device or network problem.
2. Reserve predictable space where a status would otherwise move controls during touch. Preserve the approved resting layout; add only behavior-related status accommodation when necessary and reviewed.
3. Keep failed/pending message ownership and navigation lifetime explicit. A row-based retry improvement must not lose recoverable content when the conversation unmounts. Reuse the dashboard memory boundary; do not persist plaintext to disk.
4. Use existing automatic recovery only where the subsystem supports it: EventSource reconnection, existing peer ICE restarts and music polling. No decorative reconnect timers, false restored state, silent resend queue or replacement transport.
5. Check HTTP status and response shape before confirming a remote action. A caught network exception, non-2xx response and genuine terminal session status are different facts.
6. Keep operations reversible before commit where possible. After irreversible success, explain the result; do not simulate a reversal or offer unsupported Undo.
7. Surface permission, autoplay and capability failures with useful local actions. Respect silent/no-haptic platforms without throwing or blocking the core action.
8. Preserve current safe leave/PTT cleanup and no-private-cache behavior. Offline notice is a connectivity hint, not a guarantee that unsent messages are saved or will send later.

## Accessibility behavior

- Reduced motion chooses immediate state replacement or a simple named opacity transition. Remove optional structural travel, overshoot, looping decoration and release inertia. Keep text, selected/checked states, borders, focus, hierarchy and pending/failure distinctions.
- Honor the preference in CSS **and** JS scrolling/gesture settling. React to preference changes while mounted. Give reduced-motion overrides enough specificity to win against current important rules; verify computed styles rather than relying on stylesheet intent.
- Do not introduce forced sound or extra vibration to compensate for reduced motion. Critical information is available with motion, sound and haptics all absent.
- Use native buttons, links, inputs and range controls. Preserve focus-visible, keyboard activation, target sizes, pointer cancellation and practical alternatives to dragging. Confirmation remains operable without holding or swiping.
- Keep dialog name/role, Escape, focus containment/restoration, mobile inert background and browser Back behavior. A nonmodal music player stays nonmodal.
- Use restrained `role=status`/polite announcements for pending/confirmed/reconnecting and alerts for actionable failure. Announce transitions once; do not announce every animation frame, audio sample, poll or SSE echo. Preserve mic/share `aria-pressed` and accessible names.
- Test zoom, large text, coarse pointers, on-screen keyboard and safe-area transitions. Targets must not shrink or move during an activation as a side effect of status text or motion.

## Semantic token architecture

This is a proposed architecture, not a claim that these files or exports already exist. Keep a small data layer and adapters; do not introduce a global store that replaces chat, call or music state.

```text
Canonical token data + documented calibration provenance
    -> mass-family defaults
    -> semantic recipes (control / sheet / reply / reorder / media state)
    -> CSS variables and small JS adapters
    -> existing components and their existing authoritative state
    -> optional semantic feedback sink (no-op initially)
```

### Ownership and proposed paths

| Proposed new location | Responsibility | Restrictions |
| --- | --- | --- |
| `lib/interaction/tokens.json` | One canonical serializable token source: values, units, inheritance and calibration status | No duplicated numeric values in TS, CSS or component props. No color/type/layout tokens. |
| `lib/interaction/types.ts` | Typed material, recipe, phase and feedback-event contracts | No server/database dependencies or secret configuration. |
| `lib/interaction/recipes.ts` | Resolve family defaults and named interaction policies from canonical data | Overrides reference named tokens and document a reason. No per-component arbitrary numbers. |
| `app/interaction-physics.css` | Deterministically generated CSS variables/recipe rules from the same token source | Only introduced when implementation is authorized. Do not hand-edit generated values or apply a global transition rule. |
| `components/ui/use-interaction-preferences.ts` | Lightweight shared reduced-motion/capability subscription if needed by more than one existing consumer | No remount of persistent providers; no new preference/settings UI unless separately needed and scoped. |
| `lib/interaction/feedback.ts` | Semantic feedback contract and default no-op sink | No initial sound assets, Web Audio bootstrap, navigator vibration calls, network logging or media ownership. |

A small generation/validation step can keep CSS and JS in sync when these files are implemented. Choose its exact integration after checking the then-current build scripts. No new animation library is selected or installed by this proposal. An adapter can remain a few functions if a hook/component abstraction would add unnecessary complexity.

### Token namespaces

| Namespace | Examples | Purpose |
| --- | --- | --- |
| `material.<family>` | `material.light`, `material.standard`, `material.structural`, `material.heavy`, `material.critical` | All thirteen semantic material properties, with recipe references instead of scattered numbers. |
| `motion.response` | `press`, `release`, `state` | Shared acknowledgement/settle timings and curves; input itself is never timer-gated. |
| `motion.structural` | `enter`, `exit`, `settle`, `restTolerance` | Bounded structural choreography with reduced-motion alternatives. |
| `motion.travel` | `controlPress`, `sheetEnter`, `replyLimit` | Visual movement only; do not encode layout dimensions as motion. |
| `gesture.reply` | `edgeExclusion`, `holdDelay`, `holdSlop`, `engageDistance`, `commitDistance`, `cancelDistance`, `verticalTolerance` | One shared source for detection and rendering; fixes the current TS/helper split. |
| `gesture.reorder` | `engageDistance`, `edgeZone`, `autoScrollRate`, `keyboardStep` | Pointer and keyboard policy for existing reorder. |
| `gesture.player` | `boundsInset`, `keyboardStep`, `keyboardLargeStep` | Existing music reposition semantics; transform tracking and final layout are separate. |
| `feedback.pending` | `revealDelay`, `statusPolicy` | Delay only secondary loading decoration when justified; never delay local acknowledgement or impose minimum waits. |
| `feedback.confirmed` | `visibilityDuration`, `announcementPolicy` | Tunable acknowledgement duration, subject to accessible persistent alternatives. |
| `state.<operation>` | `messageSend`, `voiceJoin`, `mute`, `musicCommand`, `destructiveCommit` | Authority, optimistic eligibility, stale result and failure/retry policy. |
| `accessibility.reducedMotion` | `spatialTravel`, `scrollBehavior`, `settlePolicy`, `loopPolicy` | Explicit CSS/JS alternative, not a blind global duration multiplier. |
| `feedback.soundRole` / `feedback.hapticRole` | detent, latch, structural-join, warning, failure | Semantics only; adapters initially no-op. |

Units are explicit: durations in milliseconds, screen displacement in CSS pixels, velocity in CSS pixels per millisecond if used, opacity/normalized progress dimensionless. Use monotonic elapsed time for gesture velocity/settling, not network/server timestamps. Numeric mass/stiffness/damping belong to a specific solver profile only; qualitative family properties remain meaningful without that solver.

### Calibration register: inherit evidence before tuning

The following are **existing source baselines**, not newly chosen targets. Initial extraction should preserve current behavior at the specific migrated consumer. Do not indiscriminately replace every 140/150 ms value with one token while hiding a behavior change.

| Baseline from the audit | Proposed owning token/policy | Treatment |
| --- | --- | --- |
| Shared controls 140 ms; dashboard button override 150 ms; rail 140 ms | `motion.response.state`, `motion.response.press/release` plus recipe mapping | Record computed result per migrated control first. Tune only with an explicit comparison. |
| Sheet 500 ms / 32 px / sampled m=1,k=300,c=30 | `motion.structural.enter`, `motion.travel.sheetEnter`, legacy calibration record | Preserve as comparison baseline. Target critical-rest timing/curve is not selected yet. Do not label current curve critical. |
| Expand 200 ms | Structural reveal recipe | Compare occasional content reflow separately from continuous-motion cost. |
| Reply: 450 ms hold, 8 px slop, 10 px engagement, 64 px commit, 72 px cap, 24 px edge/vertical exclusion | `gesture.reply.*`, `motion.travel.replyLimit` | Centralize current values first; new disengage/hysteresis values require cancellation/reversal trials. |
| Home reorder: 6 px deadband, 56 px auto-scroll zone, 10 px/frame current scrolling | `gesture.reorder.*` | Do not port px/frame as an invariant rate. Measure elapsed-time behavior at target refresh rates before choosing its replacement. |
| Player bounds 8 px; arrow steps 10/40 px | `gesture.player.*` | Preserve existing accessible placement initially. |
| Mobile loader 150 ms reveal | `feedback.pending.revealDelay` for navigation | Preserve baseline; immediate pressed/pending acknowledgement is independent. |
| General/voice Saved visibility 1,200 ms | `feedback.confirmed.visibilityDuration` | Sharing a duration must not conceal different persistence authorities. |

The 180 ms voice-save debounce, 3 s call/music polling, 30 s SSE catch-up, 10 s signaling deadline, 5 s ICE recovery delay, music drift correction and audio-analysis thresholds are **subsystem behavior**, not motion tokens. Record them where relevant but do not globally retune them as “physics.” Legacy hidden-command numbers are migration evidence, not v1 defaults.

For each tuned token, record source baseline, intended perception, device/input mode, accessibility mode, tested candidates, performance/cancellation observations and decision. Uncalibrated tokens stay marked proposed and do not silently ship placeholder values. Numeric budgets follow measured devices and refresh intervals; 16 ms, 20 ms and research velocity examples are not hard requirements copied from the PDF.

### Semantic feedback events

Future extension contract: operation/entity identity (ephemeral), semantic event, authoritative phase, optional sound/haptic role, and preference/capability policy. Examples: selection committed -> detent; local mic mute confirmed -> latch; actual room readiness -> structural join; rejected operation -> failure.

The state owner emits a confirmed event once, rather than CSS `animationend`, repeated renders, polling and SSE each producing feedback. Press acknowledgement and remote completion can have separate events but must not sound like two successful completions. Existing ringtone remains an incoming-call alert, not a new generic interaction effect. Product call/music audio and measurement contexts stay separate. Do not retain message text or private media data in feedback events.

## Implementation strategy and stages

Every phase is a later, separately reviewable change. Complete and verify one before moving to the next. The current request ends at Phase 0.

| Phase | Scope and dependency | Acceptance / evidence | Rollback boundary |
| --- | --- | --- | --- |
| **0. Audit and proposal — complete** | These two documents; no runtime modifications | Source evidence, explicit gaps, 55 existing tests passing; live/browser limits recorded | Documentation only |
| **1. Establish baselines and token foundation** | Capture current desktop/mobile/rest/busy/reduced styles; central data and typed recipe contracts; no-op semantic feedback; select a small existing control for value-preserving extraction | No rest geometry/identity changes; generated CSS/JS agree; unrelated consumers unaffected; no media/provider remount; actual reduced-policy conflicts reproduced before repair | Token adapter and its first consumer |
| **2. Make state and failure honest** | Use existing message, settings and action owners. Prioritize visible send pending/failure, safe draft recovery, decline HTTP handling, notification read outcome, preference persistence, critical-action confirmation. Assess message correlation/lifetime before retry UI | Slow/rejected/ambiguous sends and SSE-before-POST; newer typing intact; rapid settings patches; denied/stale destructive actions; no fake success or auto-resend. Confirm server permission paths remain unchanged | One operation owner at a time; no transport/schema replacement |
| **3. Shared controls, sheets and navigation** | Apply calibrated STANDARD/STRUCTURAL recipes to existing primitives. Correct scoped reduced motion and JS scroll. Preserve modal/nonmodal distinction and mobile history | Pointer/keyboard parity; stable hit boxes; close/reopen during entry; Escape/Back/navigation; correct focus/inert cleanup; uncached navigation stays interruptible; zero-motion mode never waits on animation events | Primitive/recipe pair, preserving its public behavior contract |
| **4. Direct manipulation and frame cost** | Central reply thresholds and reversal; music transform-based movement; time-based home auto-scroll only after measurement. Reuse existing gestures and alternatives | Trace slow/reverse/cancel/capture-loss input; vertical scroll/text selection/OS edges; variable-height home content; viewport clamping and keyboard placement; no playback remount. Verify reduced mode and high-refresh behavior | Individual gesture adapter; no new sheet-swipe feature required |
| **5. Media/music continuity** | Thin feedback mapping above current provider/client state. Distinguish signaling/peer/local capture and shared/local playback. Use existing recovery paths | Two real clients: permission denial, delayed capture, muted join, PTT release, temporary signaling/ICE loss, route changes, end failure, share end, autoplay block and music refresh conflict. Call remains usable while music fails | Presentation adapter; current media lifecycle and HTTP/SSE contracts retained |
| **6. Consolidate and release verification** | Audit migrated consumers for stray literals and cascade conflicts. Verify each family in representative flows. No unrelated legacy CSS deletion | Run applicable lint, typecheck, existing tests and build; production-mode keyboard/touch/reduced checks; record latency/frame traces and remaining limits; compare approved resting UI | Revert only failed component migrations; tokens can coexist with unmigrated legacy rules |
| **Later, only if requested: sensory enhancement** | Optional sound/haptic adapters and preference semantics after core behavior works silently | Sound off, unsupported API, blocked audio context, duplicate-event and failed-operation cases; core certainty remains complete | Disable adapter without affecting any operation |

Phase 2 is multiple small patches, not authorization for a broad state rewrite. Findings such as backend message correlation that would require architectural/schema work must be scoped separately before implementation; the initial plan can improve honest UI without inventing durable infrastructure. Later phases do not depend on introducing audio or vibration.

### Validation scenarios

| Scenario | Required invariant |
| --- | --- |
| Tap, then reverse/move off before release | Native cancellation is respected; no accidental mutation or displaced hit box. |
| Keyboard activate, repeat, Escape, Tab, Back | Same action meaning; predictable focus; no duplicate submit or trapped background. |
| Send while slow, fail, continue typing, switch channel | Pending differs from confirmed; intent remains recoverable; another draft is untouched; no content-based deduplication guess. |
| Server success but client response is lost | Outcome is unresolved until reconciled; no automatic duplicate send or false rejection claim. |
| Open/close/reopen a sheet during motion | Current input wins; focus/inert/history state is valid at every point. |
| Join then leave during browser permission prompt | Late tracks stop; leave/mute is not delayed by weight or pending presentation. |
| Signaling available but peer media unavailable | UI differentiates room membership from usable peer media; no fabricated recovery. |
| Music poll/command failure while talking | Last useful music state and voice session remain; retries preserve room/version rules. |
| Storage failure or rapid changes to different settings | Saved is truthful; newer/unsent intent is not lost to debounce or stale responses. |
| Reduced motion + sound off + no vibration | All critical state is readable and keyboard/screen-reader operable. |
| Phone keyboard, pinch zoom, rotation, large text, call and mini-player together | Existing composition and target clearance survive; no input-dependent geometry jump. |

Use existing tests as a baseline and add targeted behavior tests only with implementation. Source-pattern tests alone are insufficient for gesture reversal, focus, computed CSS or actual media. Performance evidence should include input-to-local-feedback samples, missed frames/long tasks during gestures, accidental commits/cancellations, scroll/target stability, and brief user comparisons of perceived weight versus waiting. Keep measurement local and free of message/media content; no analytics system is part of this request.

## Risks and decision boundaries

- The CSS cascade is layered historically. Global token substitution can change unrelated appearance or reduced behavior; migrate named consumers after computed-style baselines.
- Message failures, settings races and invitation outcomes are correctness work. Motion cannot compensate for incorrect confirmation.
- Better message retry/identity has a real current API limitation. Preserve scope and privacy; do not secretly introduce a database field, CRDT or disk outbox.
- More visual delays, stronger destructive friction everywhere, or spring physics on media controls would work against the desired fast, controlled feel.
- Modal history, provider lifetimes and transient hardware ownership are fragile integration boundaries. Never couple them to animation lifecycle events.
- Performance, accessibility and perceptual improvements are currently unmeasured. Browser/device verification is required before claiming the intended feel is achieved.

The next authorized implementation can start with Phase 1 or a specifically selected finding. No production change, deployment, database action, sound asset or haptic behavior is included in these documents.
