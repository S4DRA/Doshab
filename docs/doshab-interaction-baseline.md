# Doshab Interaction Physics: Phase 1 baseline

Recorded 2026-10-06; completed and checked 2026-10-07. Source baseline: HEAD `3a844ad4cf1d1932237d145b356c52e92f7bddfb` plus the pre-existing working tree. The [audit](doshab-interaction-audit.md) and [v1 proposal](doshab-interaction-physics-v1.md) were read in full before implementation. This document records Phase 1 only.

**Current status, 2026-10-08: PHASE 1 ACCEPTANCE — PASS. SAFE TO BEGIN PHASE 2 — YES; Phase 2 has not begun.** The [final runtime acceptance](#final-phase-1-runtime-acceptance) supersedes the earlier PARTIAL decisions. Original isolated measurements and dated interruption/handoff records below are preserved as history.

## Measurement authority

- **RUNTIME APP MEASURED: none for authenticated controls.** The local Next application started, but dashboard authentication/data loading failed because PostgreSQL at `127.0.0.1:55432` was unavailable. No database, credentials, authentication, API or transport was changed to bypass this.
- **ISOLATED STYLE PROBE:** Chromium/Opera rendered copied, source-matched control markup with the complete repository styles, in order: globals (compiled through the installed Tailwind/PostCSS), val-design, mobile, music. Real viewport overrides were 1440 × 900 and 390 × 844 CSS pixels. The new bridge was added only for the after case, with custom properties obtained from the actual recipe function.
- The probe replaced `:hover`, `:active`, and `:focus-visible` with equally specific test attributes in its copied styles. Reduced-motion media blocks were enabled/disabled in those copies. These are **forced CSS-state endpoints**, not OS preference emulation, physical touch, perceived latency, or authenticated React integration. Finite animations/transitions were finished before sampling to avoid background-tab throttling; continuous loaders were sampled without synchronization.
- **SOURCE-DERIVED:** control ownership, native activation, pending/selected applicability, original stylesheet declarations, sheet entrance trajectory, and unmeasured lifecycle behavior. Source provenance is indexed below.
- Fixture geometry is not an approved whole-app screenshot. Next font classes, actual content, full provider/shell composition, safe areas and coarse-pointer/standalone modes were not reproduced. Widths reflect system-font fixtures; isolated call/nav widths reflect the fixture's available space. No business data, message content or media was used.
- Initial baseline captures preceded implementation. Completion reran the unchanged legacy styles with the same probe to obtain matched endpoints and add the current mobile nav. Unreliable early samples taken before finishing transitions were discarded.

## Baseline by viewport and mode

All rows in this section are **ISOLATED STYLE PROBE**, **before migration**, at settled rest. Durations/easings shown once apply to each transition property when the computed list repeats the same value. `TW` below denotes the full Tailwind transition list, expanded after the tables. Opacity is explicit. Geometry is width × height in CSS px, subject to the fixture limits above. The common dashboard-button baseline is represented by the exact Start message control, not a second invented component.

### Desktop 1440 × 900, normal motion

| Control | Transition property | Duration | Easing | Transform / opacity | Geometry | Animation | Source key |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Common dashboard button / Start message + | background, border-color, transform | 0.15s | ease | none / 1 | 138.359px × 40px | none | standard |
| Chooser close icon | background, border-color, transform | 0.15s | ease | none / 1 | 32.5px × 40px | none | icon |
| Desktop rail item | background-color, color, border-color | 0.14s | ease | none / 1 | 191px × 48px | none | navigation |
| Switch input | background-color, border-color, box-shadow, color | 0.15s | ease | none / 1 | 42px × 24px | none | switch |
| Message Reply action | TW | 0.15s | ease | none / 1 | 44.625px × 26px | none | message |
| Mic-style call control | all | 0.15s | ease | none / 1 | 1383.5px × 58px | none | call |
| Shared DialogSurface | all | 0s | ease | none / 1 | 560px × 81.8438px | none | sheet |
| Loader track span | all | 0s | ease | time-varying X translation / 1 | 120.797px × 3px | val-loading-progress / 1.8s | loader |

### Desktop 1440 × 900, reduced motion forced

| Control | Transition property | Duration | Easing | Transform / opacity | Geometry | Animation | Source key |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Common dashboard button / Start message + | background, border-color, transform | 0.15s | ease | none / 1 | 138.359px × 40px | none | standard |
| Chooser close icon | background, border-color, transform | 0.15s | ease | none / 1 | 32.5px × 40px | none | icon |
| Desktop rail item | background-color, color, border-color | 0.14s | ease | none / 1 | 191px × 48px | none | navigation |
| Switch input | none | 0s | ease | none / 1 | 42px × 24px | none | switch |
| Message Reply action | none | 0s | ease | none / 1 | 44.625px × 26px | none | message |
| Mic-style call control | none | 0s | ease | none / 1 | 1383.5px × 58px | none | call |
| Shared DialogSurface | none | 0s | ease | none / 1 | 560px × 81.8438px | none | sheet |
| Loader track span | none | 0s | ease | none / 1 | 302px × 3px | none | loader |

### Mobile 390 × 844, normal motion

| Control | Transition property | Duration | Easing | Transform / opacity | Geometry | Animation | Source key |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Common dashboard button / Start message + | background, border-color, transform | 0.15s | ease | none / 1 | 138.359px × 48px | none | standard |
| Chooser close icon | background, border-color, transform | 0.15s | ease | none / 1 | 48px × 48px | none | icon |
| Mobile navigation item | all | 0.15s | ease | none / 1 | 390px × 67px | none | mobile-navigation |
| Switch input | background-color, border-color, box-shadow, color | 0.15s | ease | none / 1 | 42px × 24px | none | switch |
| Message Reply action | TW | 0.15s | ease | none / 1 | 54px × 36px | none | message |
| Mic-style call control | all | 0.15s | ease | none / 1 | 338px × 57.6875px | none | call |
| Shared DialogSurface | all | 0s | ease | identity matrix / 1 | 374px × 90px | val-mobile-sheet-spring / 0.5s | sheet |
| Loader track span | all | 0s | ease | time-varying X translation / 1 | 112px × 3px | val-loading-progress / 1.8s | loader |

### Mobile 390 × 844, reduced motion forced

| Control | Transition property | Duration | Easing | Transform / opacity | Geometry | Animation | Source key |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Common dashboard button / Start message + | background, border-color, transform | 0.15s | ease | none / 1 | 138.359px × 48px | none | standard |
| Chooser close icon | background, border-color, transform | 0.15s | ease | none / 1 | 48px × 48px | none | icon |
| Mobile navigation item | none | 0s | ease | none / 1 | 390px × 67px | none | mobile-navigation |
| Switch input | none | 0s | ease | none / 1 | 42px × 24px | none | switch |
| Message Reply action | none | 0s | ease | none / 1 | 54px × 36px | none | message |
| Mic-style call control | none | 0s | ease | none / 1 | 338px × 57.6875px | none | call |
| Shared DialogSurface | none | 0s | ease | none / 1 | 374px × 90px | none | sheet |
| Loader track span | none | 0s | ease | none / 1 | 280px × 3px | none | loader |

`TW` = color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events. This is the existing utility; Phase 1 adds no global transition-all rule.

The sheet uses its existing 500 ms sampled entry with linear interpolation; 32 px initial Y travel, exact final rest and a small underdamped overshoot are **SOURCE-DERIVED**, not a measured motion trace. Desktop has no entry animation. Loader animation timing is existing 1.8 s ease-in-out; reduced mode is static with its existing wider track fill.

## State endpoints

All rows below are **ISOLATED STYLE PROBE**. H = forced hover. P = forced active **and hover together**, approximating a pointer press over the target. F = focus-visible outline width/style and offset. D = disabled opacity/transform. Busy and selected are included only where the existing source supports them; injecting an attribute does not establish operation success. Rest opacity is 1 in all fixture controls.

| Control / viewport / mode | H transform | P transform / filter | F outline / offset | D opacity / transform |
| --- | --- | --- | --- | --- |
| Common dashboard button / Start message + / 1440 / normal | Y -1 px | Y 1 px / brightness(1.1) | 2px solid / 3px | 0.58 / none |
| Chooser close icon / 1440 / normal | Y -1 px | Y 1 px / brightness(1.1) | 2px solid / 3px | 0.58 / none |
| Desktop rail item / 1440 / normal | none | none / none | 2px solid / 3px | N/A (link) |
| Switch input / 1440 / normal | none | none / none | 2px solid / 3px | 0.58 / none |
| Message Reply action / 1440 / normal | matrix(1, 0, 0, 1, -1, -1) | Y 1 px / none | 2px solid / 3px | 0.58 / none |
| Mic-style call control / 1440 / normal | none | Y 1 px / none | 2px solid / 3px | 0.58 / none |
| Common dashboard button / Start message + / 1440 / reduced | Y -1 px | Y 1 px / brightness(1.1) | 2px solid / 3px | 0.58 / none |
| Chooser close icon / 1440 / reduced | Y -1 px | Y 1 px / brightness(1.1) | 2px solid / 3px | 0.58 / none |
| Desktop rail item / 1440 / reduced | none | none / none | 2px solid / 3px | N/A (link) |
| Switch input / 1440 / reduced | none | none / none | 2px solid / 3px | 0.58 / none |
| Message Reply action / 1440 / reduced | none | none / none | 2px solid / 3px | 0.58 / none |
| Mic-style call control / 1440 / reduced | none | none / none | 2px solid / 3px | 0.58 / none |
| Common dashboard button / Start message + / 390 / normal | none | none / none | 2px solid / 3px | 0.58 / none |
| Chooser close icon / 390 / normal | none | none / none | 2px solid / 3px | 0.58 / none |
| Mobile navigation item / 390 / normal | none | none / brightness(0.94) | 2px solid / 3px | N/A (link) |
| Switch input / 390 / normal | none | none / none | 2px solid / 3px | 0.58 / none |
| Message Reply action / 390 / normal | matrix(1, 0, 0, 1, -1, -1) | none / brightness(0.94) | 2px solid / 3px | 0.58 / none |
| Mic-style call control / 390 / normal | none | none / brightness(0.94) | 2px solid / 3px | 0.58 / none |
| Common dashboard button / Start message + / 390 / reduced | none | none / none | 2px solid / 3px | 0.58 / none |
| Chooser close icon / 390 / reduced | none | none / none | 2px solid / 3px | 0.58 / none |
| Mobile navigation item / 390 / reduced | none | none / brightness(0.94) | 2px solid / 3px | N/A (link) |
| Switch input / 390 / reduced | none | none / none | 2px solid / 3px | 0.58 / none |
| Message Reply action / 390 / reduced | none | none / brightness(0.94) | 2px solid / 3px | 0.58 / none |
| Mic-style call control / 390 / reduced | none | none / brightness(0.94) | 2px solid / 3px | 0.58 / none |

- **SOURCE-DERIVED active without hover:** the more specific dashboard class rule can retain +1 px press travel on mobile when the later hover reset does not match. The combined-hover probe is not evidence that every real mobile press has zero travel. Normal-mode transform rules are untouched; the new reduced selector suppresses either case for Start message.
- Switch thumb: normal transition is `background-color, transform`, 140 ms ease; it moves X 0 → 18 px when checked. Reduced: transition none/0 s, the same checked endpoint. The input itself computes to 150 ms because of the later field rule, so the audit's 140 ms base declaration must not be used as its universal computed value.
- Start message has **no selected, disabled or asynchronous busy state in product code**. It is always a native type=button opening local chooser state. Forced disabled is a CSS regression check only. Busy/selected attributes do not alter its baseline appearance.
- Icon close is likewise local, with no asynchronous busy state. Message Reply is local; other message actions use existing busy guards. The probe does not submit messages or invoke reactions.
- Call control `aria-busy=true` gives opacity .8; disabled computes to .58 from an existing important global rule (the dashboard's .45 declaration does not win), while selected changes its inset marker. Capture/media state and PTT are source-derived only; no call was started.
- Rail selected color and inset marker remain from the current CSS; rail transform stays none. Mobile selected marker is source-derived (`aria-current=page`); the desktop rail is hidden on mobile, and mobile navigation is hidden on desktop. Fixture widths are not production nav allocation measurements.
- Shared dialog and loader are not clickable controls: hover/press/disabled are N/A. Dialog focus trap, Escape, Back, inert cleanup and reopening were not exercised in the authenticated application.
- Navigation pending is **SOURCE-DERIVED**: a 2 px line, opacity 0 → .8, `val-navigation-progress` 1 s ease-in-out alternating scaleX .15 → 1; reduced retains a static indicator. Mobile loader reveal remains 150 ms. Neither indicator is tokenized here.

## Source index

Paths are relative to the repository. Line anchors identify the inspected baseline; component lines can move after import additions.

| Source key | Source |
| --- | --- |
| standard | messages-page-client.tsx; val-design.css:58-77,646; mobile.css:126-127,354 |
| icon | messages-page-client.tsx; globals.css:1919; val-design.css:58-70; mobile.css:128 |
| navigation | dashboard-sidebar.tsx; val-design.css:897-930 |
| mobile-navigation | mobile-shell.tsx:60-68; mobile.css (val-mobile-nav rules) |
| switch | profile-settings-panel.tsx; globals.css:2180-2236,3269; val-design.css:198-201 |
| message | message-list.tsx:398-407; Tailwind transition utility; globals.css:2322; mobile.css:127 |
| call | call-workspace.tsx; val-design.css:377-384,571-572; mobile.css:246 |
| sheet | dialog-surface.tsx:97-117; val-design.css:742-758; mobile.css:181,603-628 |
| loader | ValLoadingScreen.tsx; globals.css:2914-2922 |

## First consumer: before versus after

Only the hero **Start message +** button in [MessagesPageClient](../components/messages/messages-page-client.tsx) opts into `control.standard`. It opens the existing chooser through the same immediate `onClick`; it owns no network request, navigation lifecycle, media session or gesture.

| Property | Before | After | Authority |
| --- | --- | --- | --- |
| Label / native activation | Start message + / type=button | Identical; no added event handlers | Source + component test |
| Transition property | background, border-color, transform | Identical inherited allowlist | Isolated probe |
| Normal duration / easing | Three 0.15 s/ease entries | Single 0.15 s/ease entry repeats across the same property list | Isolated probe + canonical recipe test; semantically identical |
| Rest dimensions | 138.359 × 40 desktop; 138.359 × 48 mobile | Identical in fixture | Isolated probe; not app-font geometry |
| Color, typography, borders, shadows, padding, opacity, normal hover/press endpoints | Existing cascade | Identical in all compared fixture states | Isolated probe |
| Focus-visible | 2 px solid accent, 3 px offset | Identical | Probe and native keyboard check |
| Reduced transition | 150 ms still wins | none / 0 s | Isolated probe |
| Reduced optional travel | Desktop hover -1 px / press +1 px survives | none in all states | Isolated probe |
| Reduced state feedback | Label, color, focus and native action | Preserved; no animation completion dependency | Source + tests + isolated native input |
| Other sampled controls | Existing values | No style differences, excluding time-varying loader samples | Isolated comparison |

Native **Enter and Space each fired one click**, in desktop normal and mobile forced-reduced fixtures using the **production CSS chunks**. Focus-visible remained active with the same outline; reduced computed transition and transform were none. A separate component test executes the real JSX handler with isolated hooks and verifies the immediate chooser-state update. Neither substitutes for a hydrated authenticated chooser/focus/history test.

## CSS integration and verification

The bridge has a single import in MessagesPageClient. The production messages-page manifest references: font CSS → globals → val-design → mobile → music → interaction-physics. The final interaction chunk contains only two opt-in rules (480 bytes in this build). Every selector requires the recipe attribute and `button.app-button-primary` under `#val-app`. Its specificity exceeds the legacy important hover/active selectors, so reduced suppression does not depend on chunk order. Existing imports were not moved or duplicated.

The initial probe was a disposable implementation artifact, not a product route or test framework. Its script, raw captures and style handoff are removed after extracting these results. The maintained tests cover the foundation and narrow consumer integration. Repeat authenticated computed-style/input checks in the real messages route once the local database is available.

## Verification result and remaining limits

- `npm run lint`: exit 0, no warnings/errors after correcting the new helper's reserved module-variable lint violation.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: exit 0. There is no existing typecheck package script.
- Existing package test scripts: audit 6, media 20, chat 6, mobile 20, music 9; all 61 pass, no failures/skips.
- `npm run test:interaction`: 10 pass, no failures/skips.
- `npm run build`: exit 0; Prisma client generation, Next compile, TypeScript and all 47 static pages completed. No migration was run.
- Not measured: authenticated app geometry/font rendering, hydrated chooser lifecycle, actual OS preference change while mounted, real touch/standalone/safe-area behavior, screen reader, frame pacing or perceived weight. Preference subscription changes are unit-tested; CSS reduced blocks are forced in the probe.
- No Phase 2 behavior, gesture rewrite, call/music presentation, sound/haptics, routes, APIs, transports, schema or provider lifetimes changed.
- **Phase 1 acceptance: PARTIAL.** Foundation, narrow migration and automated checks are complete; authenticated runtime acceptance remains open. Make the configured local PostgreSQL instance available and verify this control in-app before treating the phase as fully accepted and moving into Phase 2 implementation.

## AUTHENTICATED RUNTIME VERIFICATION

2026-10-07 continuation. This section adds real application evidence; the isolated-style measurements above remain a separate historical record. **Acceptance remains PARTIAL.** The database blocker was resolved, but the remaining browser checks were interrupted and the replacement Computer Use tool could not start.

### Environment and method

- **AUTHENTICATED APP:** Windows, Opera/Chromium, Next.js 16.3.8 development server, real `/dashboard/messages` route, existing browser Test-account session, actual React component, fonts, dashboard shell and chooser. The existing account has no friends or message threads; no fabricated data was added.
- The existing PostgreSQL 18.3 cluster at `.local-postgres/data` was started using its recorded `postmaster.opts` arguments: port `55432`, host `127.0.0.1`. `.env.local` already points to this cluster. No URL, schema, authentication, infrastructure or external database was changed.
- Read-only Prisma check: `'SELECT 1;' | node node_modules/prisma/build/index.js db execute --stdin` completed successfully, exit 0. The dev server started with `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000`.
- Browser viewport override was **1440 x 900 CSS px**, with actual `matchMedia('(prefers-reduced-motion: reduce)').matches === false` and `(pointer: coarse) === false`. Browser-native/locator input, accessibility snapshots and read-only DOM/computed-style inspection were used. No forced CSS pseudo-state or modified media block was used in these authenticated checks.

### Results obtained before interruption

| Check | Authenticated result / limitation |
| --- | --- |
| Resting Start message control | Native `button`, label `Start message +`; **141.140625 x 40 px**, x=240.25, y=234.28125. Actual Geist font: 800, 12 px / 17.4 px. Transform none; opacity 1. This is app geometry, unlike the system-font fixture widths above. |
| Normal transition | Computed `background, border-color, transform`; **0.15 s / ease**. No timing or travel was tuned. |
| Resting appearance | Computed accent border, existing inset/drop shadows and 0 px / 18 px padding were present. Whole-app screenshot comparison against a pre-migration authenticated capture was not performed. |
| Enter | One Enter action opened **one visible New message dialog**, with focus inside on `Close New message`. Handler invocation count was not instrumented. |
| Chooser keyboard navigation | Tab moved from the header close button to the inner close button, then the friend-search input, then wrapped to the header close button. |
| Escape | Closed the dialog; dialog count became zero. Button dimensions and x/y position were unchanged. |
| Focus return | **Unresolved observation:** after that Enter/Tab/Escape sequence, `document.activeElement` was not the Start message button and it did not match `:focus-visible`; accessibility reported the page focused. Do not record this as a passed focus-restoration check. |
| Pointer click | A subsequent single pointer click opened one visible chooser and focused its header close button. This confirms hydrated local activation. Separate held-down/hover endpoints, release/cancel behavior, pointer-close focus restoration and repeated cycles were not completed. |
| Immediate response / motion dependency | Chooser appeared following the input actions. Input-to-paint latency was not measured. **SOURCE-DERIVED:** the unchanged `onClick` sets local chooser state directly, with no animation/timer gate. |
| Opt-in scope | Actual DOM contained exactly **one** `data-interaction-recipe` element. Source search confirmed the sole component opt-in and CSS import remain in MessagesPageClient. |

### Outstanding checks and handoff

- **NOT TESTED:** Space activation in the authenticated app, complete native focus-visible verification, repeated pointer/keyboard open-close cycles, held-pointer geometry/cancellation, duplicate-handler detection, final console inspection and complete authenticated before/after appearance comparison.
- **Mobile / EMULATED TOUCH:** no authenticated 390 x 844 run was completed. The earlier isolated mobile fixtures remain isolated evidence. **TOUCH AUTHORITY = NOT TESTED** for this authenticated run; neither touch emulation nor real hardware was exercised. Touch scrolling, safe areas and on-screen keyboard behavior are unverified.
- **LIVE OS REDUCED MOTION:** not tested. No user confirmation that Animation effects was off was received, and no OS preference change was made by the agent. The latest instruction requires finishing normal desktop/mobile checks before asking for that change. Keep the user's normal setting until that handoff; after the eventual reduced-motion run, explicitly request restoration to ON unless reduced motion is their usual preference.
- **LIVE PREFERENCE SUBSCRIPTION:** not verified. **SOURCE-DERIVED:** this consumer responds through the CSS media query; `subscribeInteractionPreferences` is an exported, unit-tested foundation helper with no mounted production consumer yet. CSS preference reaction and helper subscription coverage must not be conflated. No provider lifecycle was instrumented, and no active call/music session was tested.
- No Phase 1 regression has been established. The focus-return observation needs reproduction and comparison with the unchanged chooser/alternate existing opener before attribution. DialogSurface and the button's click handler are unchanged by Phase 1; no focus repair was made based on this incomplete observation. Runtime network, message, media, navigation and console regression checks remain incomplete; source scope alone is not a runtime pass.
- After the interruption, the earlier browser tool was no longer exposed. The available Computer Use tool failed before attaching to a window: installed Node **v22.17.0**, required **>= v22.22.0**. This is a tooling prerequisite, not an application failure. Restore working browser automation or provide a compatible Node runtime before continuing. No global Node upgrade was performed.
- The interruption also stopped the local services. They were restarted with the same already verified cluster arguments and dev command; no database discovery or architecture change was repeated. App continuity across that interruption cannot be claimed. Establish a fresh mounted baseline before the later live-preference test.
- Only these two documentation files were edited during runtime acceptance. No application code, token, test, schema or configuration was changed. Lint/typecheck/tests/build were not rerun because there was no code fix; the earlier passing results remain the last automated run.

**PHASE 1 ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2: NO.** Resume the remaining normal desktop checks, then authenticated mobile checks, then obtain explicit OS-setting confirmation and test live reduced motion. Phase 2 has not begun.

### Resume prerequisite check — 2026-10-07

The subsequent resume attempt confirmed the same PostgreSQL cluster was still running and the existing dev server returned HTTP 200 for `/login`; no service restart or database discovery was needed. This HTTP check does not establish the browser's current authenticated session or media-query preference.

Computer Use still resolved `C:\Program Files\nodejs\node.exe` as **v22.17.0**, below its **>= v22.22.0** requirement. Resetting its kernel and retrying produced the same error before browser attachment. `node --version` independently reported v22.17.0; no `NODE_REPL_NODE_PATH` override was set in the process, user or machine environment. A newer executable path or completed runtime update was requested; no confirmation was received during this attempt. No newer browser evidence was obtained, and Windows Animation effects was not changed or requested to be turned off.

**SOURCE-DERIVED:** DialogSurface saves the active element when its focus effect mounts, removes its key/focus listeners on cleanup, and restores focus if that saved element is still connected. Its source is unchanged by Phase 1. The existing, unmigrated `Start a conversation` button on this same empty Messages screen opens the same chooser and provides the comparison for the next runtime sequence. Source inspection alone does not establish why the prior focus-return observation failed: **FOCUS RETURN CLASSIFICATION = D, UNRESOLVED**. No code fix is justified yet.

Outstanding desktop pointer/Space/focus cycles, mobile/touch, live OS preference, console and provider-continuity checks remain pending. Only documentation was appended; no automated application checks were rerun. **Acceptance remains PARTIAL; safe to begin Phase 2 remains NO.**

### Tooling update — 2026-10-07

After the user's runtime update, both the system Node executable and the configured bundled executable report **v24.21.0**; JavaScript execution now works. The earlier Node-version blocker is resolved. PostgreSQL remained running. The dev server was restarted with the same existing command and `/login` returned HTTP 200.

Computer Use still failed before window attachment: its service package was rejected as outside the running connection's configured trusted module directories. The bundled package exists, and the current on-disk Codex configuration includes its module directory and service registration. The running connection appears not to have loaded those updated settings; the user was asked to fully restart Codex before continuing. No trust restrictions were bypassed, no Codex configuration was edited by the agent, and no browser/OS preference evidence was collected. Remaining checks, focus classification D, and **PARTIAL / Phase 2 NO** are unchanged. No product code or interaction values changed.

### Authenticated normal-motion continuation — 2026-10-07 to 2026-10-08

The browser connection recovered after the restart. The following observations supersede the corresponding pending checks above; the earlier records remain historical evidence. On October 8, the existing local cluster and dev server were restarted with their previously verified arguments after stopping overnight. The existing Test-account session loaded the real Messages route again. No infrastructure, authentication, token or product code was changed.

| Check | Evidence and result |
| --- | --- |
| AUTHENTICATED APP / desktop pointer | At 1440 x 900 with reduced motion false, rest remained **141.140625 x 40 px**, with 150 ms / ease. Settled hover was Y -1 px; a held native press was Y +1 px. Width/height and layout dimensions stayed unchanged. No chooser appeared while held; release opened one. Dragging off before release opened none and the button returned to rest. |
| Target stability qualification | The existing transform applies to the button itself: its visual/hit bounds move vertically by 1 px during normal hover/press. This is preserved legacy behavior, not a perfectly stationary hit box or a Phase 1 change. An inner-wrapper migration was not performed. |
| AUTHENTICATED APP / desktop keyboard | Native focus from the preceding search control gave Start message `:focus-visible`, a 2 px solid accent outline and 3 px offset. Enter and Space each opened one visible chooser. Tab traversed its close controls and search, then wrapped. Escape and keyboard close activation closed it. |
| AUTHENTICATED APP / repeated chooser cycles | Repeated pointer and keyboard cycles produced dialog counts of zero or one, with no duplicate visible chooser or stuck background. Exact handler invocation counts were not instrumented. |
| AUTHENTICATED APP / focus attribution | Focus ended on BODY after focused Start message -> Enter -> Tab -> Escape; pointer open/close; keyboard close activation; and immediate Escape. The existing **unmigrated Start a conversation** opener reproduced BODY focus after keyboard/Tab/Escape and pointer open/close. **FOCUS RETURN CLASSIFICATION = B: pre-existing DialogSurface behavior in this development/browser environment.** The shared surface and handlers are unchanged. Its underlying cause was not diagnosed; this is not a passed focus-restoration check. No repair was made. |
| AUTHENTICATED APP / mobile viewport | At **390 x 844**, actual reduced motion false and coarse-pointer query false, Start message measured **141.140625 x 48 px**, x=38, y=226.890625, transform none, 150 ms / ease. Pointer open/close and native Enter/Space cycles preserved these dimensions. Document scroll width was 390 px; no horizontal overflow was measured. This is viewport testing with a fine pointer, not touch evidence. |
| AUTHENTICATED APP / mobile chooser | Each activation opened one dialog and focused its header close control. Six background siblings became inert; closing restored an inert count of zero. Escape, header close and browser Back worked; Back stayed on `/dashboard/messages`. Focus returned to BODY, matching the existing behavior above, and subsequent native focus/activation remained usable. |
| AUTHENTICATED APP / mobile settled placement | After the existing entry animation settled, the sheet measured x=8, y=589, width=374, height=247, bottom=836 within the 844 px viewport. Its content required no scrolling in this empty account. No obvious clipping appeared in the browser screenshot. Hardware safe areas, touch scroll and an on-screen keyboard are not established by this result. |
| SOURCE-DERIVED / scope | Source review still shows one Start message opt-in, unchanged native click scheduling and unchanged DialogSurface. The JS preference subscription has no production consumer. No timing/travel tuning or interaction migration was added. |

**EMULATED TOUCH remains pending.** The available browser capability changes viewport size but does not enable touch mode. The user was asked to enable DevTools Mobile/touch emulation at 390 x 844 and reply `mobile`; no confirmation or coarse-pointer/touch-mode evidence has been obtained yet. Do not label the fine-pointer mobile observations as emulated touch.

**LIVE OS REDUCED MOTION remains pending.** Animation effects has not been requested OFF in this continuation: the required normal touch stage comes first. A new mounted baseline is established for the eventual live change; it must not be reloaded between the confirmed OS change and inspection. Final console/navigation/continuity review remains open. An earlier console entry came from `chrome-error://chromewebdata/` while the server was unavailable, rather than the VAL page; it does not replace final console inspection.

Only these two acceptance documents changed during this continuation. Earlier automated results remain the latest run; no code fix warranted rerunning them. **PHASE 1 ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2: NO.**

### Emulated-touch setup — 2026-10-08

The user confirmed `mobile`. The current authenticated Messages tab reported coarse pointer true; its initial emulated viewport was 430 x 932. The documented viewport override changed this to the requested **390 x 844** while coarse pointer remained true and reduced motion remained false. **TOUCH AUTHORITY = EMULATED**, with no real-device claim. Start message remained **141.140625 x 48 px**, transform none, 150 ms / ease; document scroll width was 390 px.

Both the accessibility click and the documented locator alternative timed out on browser input dispatch. After each attempt, inspection showed zero dialogs, no active press and no stuck inert content. These failed automation attempts are **not completed touch activation tests**. Native window control was also unavailable. The user was asked to tap Start message once in the emulated page, leave the chooser open and reply `open` for inspection. Touch activation/close/scroll acceptance remains pending that handoff.

The current tab's captured warning/error console list was empty. Source review still found one component opt-in, two narrowly scoped CSS rules and no production consumer of the JS preference subscription. No product code or interaction value changed. Final navigation/continuity and live OS reduced-motion checks remain pending; Animation effects OFF has not yet been requested. **PHASE 1 ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2: NO.**

The user subsequently reported `open` after a manual tap in the emulated page. **AUTHENTICATED APP + EMULATED TOUCH:** direct inspection showed exactly one chooser, focus on its header close button, six inert background siblings, and unchanged Start message dimensions/position. The settled sheet was x=8, y=589, 374 x 247 px, bottom=836; its client content had no horizontal or vertical overflow. Warning/error console capture remained empty. This is manually driven emulation followed by browser inspection, not a successful automated touch dispatch. The user was asked to close, repeat two single-tap open/close cycles and try page scrolling; that confirmation is still pending. OS reduced-motion testing has not started.

### Normal mobile completion and OS handoff — 2026-10-08

The user replied `closed` to the requested close/repeat/scroll check, with no problem reported. **EMULATED TOUCH / USER-REPORTED:** two further single-tap open/close cycles and page scrolling worked. **AUTHENTICATED APP / DIRECT INSPECTION:** dialog count zero, inert count zero, unchanged 141.140625 x 48 px control at x=38/y=226.890625, one recipe, document scroll width 390, reduced-motion false and coarse-pointer true. The captured warning/error console list was empty. Exact touch-event types and handler counts were not instrumented; real hardware, safe-area changes and on-screen keyboard behavior remain unverified. The empty account limits scrolling/content coverage.

Normal desktop and mobile checks are complete within those stated limits. Before the OS handoff, the mounted Messages page was given the temporary local search value `phase1-continuity` and sort `name`. Both were inspected, and the normal 150 ms / ease transition was recorded. These are local UI state markers, not message data or persistence changes. No reload/navigation was performed during this baseline setup. The user was then asked to turn Windows Animation effects OFF and reply `off`; **LIVE OS REDUCED MOTION remains untested until that explicit confirmation arrives**. No code or calibration values changed. Phase 1 remains PARTIAL / Phase 2 NO pending the remaining preference and regression checks.

### Live OS reduced-motion verification — 2026-10-08

After the user's explicit `off` reply, the real browser query **`matchMedia('(prefers-reduced-motion: reduce)').matches === true`** was inspected. This is **LIVE OS REDUCED MOTION**, not a forced stylesheet/media-block test. DevTools had been closed and coarse pointer was now false; the reduced input checks below use browser-native fine-pointer/keyboard input at the specified viewport sizes. The preceding manual coarse-pointer checks remain the separate emulated-touch evidence.

| Check | Authenticated live result |
| --- | --- |
| Mounted CSS response | Without reload or navigation, the same Messages page changed from 150 ms / ease to **transition property none / duration 0 s / transform none**. Search `phase1-continuity` and sort `name` remained. Their state is local React state with empty/recent initial values; retention supports page continuity across the preference change. |
| Mobile rest and held press | At 390 x 844, **141.140625 x 48 px**, x=38/y=226.890625, unchanged label. During a one-second native held press, active/hover were true, transform remained none, dimensions/position did not move and dialog count remained zero. Release opened exactly one chooser. Pointer close restored zero dialogs/inert elements. |
| Mobile keyboard | Native focus from Search messages -> Shift+Tab gave Start message `:focus-visible`, 2 px solid outline / 3 px offset. Enter and Space each opened one chooser; Tab/Escape and keyboard close activation closed it. No stuck background or Space-induced page scroll was observed. |
| Mobile zero-motion surface | The existing sheet computed animation none / 0 s; its settled rectangle remained x=8/y=589, 374 x 247 px, bottom=836. Focus entered the close button; six background siblings became inert while open and returned to zero on close. This uses existing sheet reduced behavior, not a Phase 1 sheet migration. |
| Desktop rest and held press | At 1440 x 900, **141.140625 x 40 px**, x=240.25/y=234.28125. Active/hover held press and post-release hover computed transform none / transition none / 0 s. Dimensions and position were exact throughout; release opened one chooser. |
| Desktop keyboard | Native focus-visible remained 2 px solid rgb(255, 90, 31) / 3 px offset. Enter and Space each opened one chooser; Tab traversal/Escape and keyboard close worked. The existing BODY focus-return behavior persisted, classification B; no Phase 1 focus regression or repair. |
| Opt-in isolation | DOM recipe count remained one. In the same reduced desktop page, unmigrated Start a conversation retained its legacy background/border-color/transform list at 150 ms / ease. The new bridge affects only its opted-in control. |
| Console and state | Captured warning/error list was empty after the reduced input cycles. Search/sort markers survived mobile/desktop viewport changes and chooser cycles. No message was sent and no call/music session was started. |

**LIVE PREFERENCE CHANGE: PASS for the mounted CSS consumer.** The exported JS subscription helper still has no production consumer; its earlier unit tests are not mounted runtime evidence. **SOURCE-DERIVED:** provider placement/keys, message drafts, call/music ownership and action scheduling are unchanged; provider lifecycle counts and active media continuity were not instrumented. No animation event owns the tested chooser activation/close.

Reduced verification is complete within those limits. The user was asked to restore Animation effects ON and reply `on`, or explicitly retain OFF as their usual preference. Restoration and final navigation/regression review remain pending. No product code, token value or calibration decision changed. **Phase 1 remains PARTIAL / Phase 2 NO until those remaining checks are completed.**

## Final Phase 1 runtime acceptance

Completed **2026-10-08**, after the user's explicit `on` reply. This is acceptance of the foundation and its single value-preserving consumer within the evidence limits below; it is not perceptual calibration or acceptance of later phases.

| Required result | Final evidence / decision |
| --- | --- |
| DESKTOP POINTER | **PASS / AUTHENTICATED APP.** Native hover/held press/release and drag-off cancellation passed in normal mode; reduced held press kept exact position/dimensions and release opened one chooser. Normal legacy 1 px transform travel is preserved, including its moving hit bounds. |
| DESKTOP KEYBOARD | **PASS / AUTHENTICATED APP.** Native focus-visible, Enter, Tab containment and Escape/close activation passed in normal and live reduced modes. |
| SPACE KEY RESULT | **PASS.** Space opened one visible chooser in normal and live reduced desktop/mobile viewport checks. No Space-induced page scroll was observed in reduced mobile mode. Exact handler counts were not instrumented. |
| CHOOSER LIFECYCLE | **PASS for activation, focus entry/containment and cleanup.** Repeated cycles, mobile Back and zero-motion operation produced zero/one dialogs without stuck inert background. Focus restoration is qualified separately below. |
| FOCUS RETURN CLASSIFICATION | **B: pre-existing DialogSurface behavior in this development/browser environment.** BODY receives focus after tested closes with both migrated and unmigrated openers. The cause is not diagnosed and restoration is not recorded as passing. No Phase 1-caused regression or out-of-scope repair. |
| MOBILE RESULT / TOUCH AUTHORITY | **PASS within emulation coverage; EMULATED.** Real authenticated 390 x 844 layout and manually driven coarse-pointer activation were inspected. The user confirmed repeated single-tap close/reopen cycles and scrolling without a reported issue. Direct inspection confirmed one open chooser, stable 141.140625 x 48 px geometry, no horizontal document overflow and correct final inert cleanup. Repeated touch cycles/scroll are user-reported; automated touch dispatch timed out and does not count as a pass. |
| LIVE REDUCED MOTION | **PASS.** After confirmed OS OFF, actual query true; transition none / 0 s, transform none, stable geometry/label and working pointer/Enter/Space at 390 x 844 and 1440 x 900. |
| LIVE PREFERENCE CHANGE / RESTORATION | **PASS for CSS.** Local search/sort survived OFF and ON without reload/navigation. After confirmed OS ON, query false and 150 ms / ease returned at both viewport sizes, with unchanged geometry. The JS subscription helper remains unused in production and has unit-test evidence only. |
| NAVIGATION / SHELL CONTINUITY | **PASS for the inspected idle shell.** Messages -> Spaces displayed the existing pending surface and then usable Bigger spaces content; the existing Messages link returned to the correct route. Spaces had zero recipe attributes; Messages returned to exactly one. PeopleRail's local `phase1-shell` search state survived Spaces -> Messages, supporting continuity of the existing shell subtree. Provider ownership/keys are unchanged in source; lifecycle counters and active media sessions were not instrumented. |
| CONSOLE RESULT | **No warning/error entries captured in the final authenticated tab**, including reduced cycles and the route check. The earlier unavailable-server browser error remains a separate historical entry, not a VAL regression. |
| REGRESSIONS / SCOPE | **No Phase 1 regression identified.** Source diff retains one control opt-in and two scoped bridge selectors; no additional transition migration or global rule. Message, media, route, provider, API, transport, schema and permission-owner code is unchanged. Empty-account navigation/chooser tests do not establish active messaging/call/music correctness. |

Temporary Messages search/sort markers and PeopleRail search were cleared to their initial values. The viewport override was reset; the user's current browser viewport returned to 383 x 829, with reduced query false, one recipe, zero dialogs/inert elements and no horizontal document overflow. The authenticated Messages page remains open. Windows Animation effects is restored ON; no user action remains for this acceptance.

### Files, checks and remaining limits

- **Files changed during runtime acceptance:** only `docs/doshab-interaction-baseline.md` and `docs/doshab-interaction-calibration.md`. The earlier Phase 1 implementation is unchanged; unrelated working-tree files are preserved. No token tuning, product fix, commit, deployment or database/authentication change.
- **Checks rerun:** documentation whitespace checks, including `git diff --check`, passed with exit 0; untracked acceptance documents also had zero trailing-whitespace lines. Git's existing LF/CRLF conversion notices are not whitespace failures.
- **Application checks not rerun:** no application code changed. The last recorded run remains lint exit 0, TypeScript exit 0, existing 61 tests plus 10 interaction tests passing, and build exit 0 with 47 static pages. These are prior results, not a new runtime-acceptance test run.
- **Still unverified:** physical touch/device safe areas, standalone mode, on-screen keyboard, pinch/OS edge behavior, screen reader, rich populated conversations, active call/music continuity, internal provider lifecycle counts, authenticated pre-migration screenshot comparison, input-to-paint latency, frame pacing and perceived weight. The current acceptance makes no performance/perception guarantee. Focus-return classification B remains a known existing issue.
- **Calibration remains unchanged:** extraction preserves the existing 150 ms / ease baseline; no token is newly CALIBRATED. Future phases retain their own behavior/device verification requirements.

**PHASE 1 ACCEPTANCE: PASS. SAFE TO BEGIN PHASE 2: YES.** This is readiness for a separately requested next phase, not execution of it. **Phase 2 has not begun.**
