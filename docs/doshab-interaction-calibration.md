# Doshab Interaction Physics: Phase 1 calibration register

Date: 2026-10-07. This register covers only the foundation and one value-preserving consumer. **No entry is CALIBRATED.** Passing tests/builds establishes correctness of extraction, not perceived quality. See the [baseline](doshab-interaction-baseline.md) for measurement authority and runtime limits.

**Current status, 2026-10-08: PHASE 1 ACCEPTANCE — PASS. SAFE TO BEGIN PHASE 2 — YES; Phase 2 has not begun.** See [final runtime acceptance](#final-phase-1-runtime-acceptance). Earlier PARTIAL/handoff records below are preserved as history; this decision does not change calibration status or values.

## Architecture and ownership

`lib/interaction/tokens.json` is canonical for new numeric/tunable values. `validation.ts` uses the repository's existing Zod dependency to reject invalid values/units/status, unknown fields, incomplete material properties, missing families and invalid inheritance. It validates once when recipes load; malformed configuration fails visibly rather than shipping a silent fallback.

`types.ts` names the five families, all thirteen material concepts, recipe names, interaction/operation phases and feedback roles. Values are qualitative policies, not kilograms or a spring solver. STANDARD declares complete defaults; LIGHT, STRUCTURAL, HEAVY and CRITICAL inherit them and supply explicit overrides. The returned material is a copy, so callers cannot mutate the registry through it.

`recipes.ts` resolves material defaults and named recipes. The only numeric CSS consumer is the existing Start message + hero button. It retains its class, label, type, immediate click handler and markup; only a recipe attribute and custom-property style are added.

The CSS bridge is deliberately small: SSR-safe inline custom properties from `getControlInteractionStyle("control.standard")`, plus two opt-in rules in `app/interaction-physics.css`. A generated stylesheet/build hook would add a second artifact to synchronize for one consumer. No generator is necessary because CSS contains **no numeric interaction values**: tests resolve the actual JSON and verify the bridge. The existing transition property allowlist and all geometry/visual rules stay in the original cascade. This also leaves unrelated 140/150 ms mappings intact.

`preferences.ts` offers a browser/SSR-safe read and a disposable MediaQueryList change subscription. No shared React hook is currently warranted: the first consumer uses CSS, and no JS-scrolling consumer is migrated. A future JS caller should subscribe, read the current preference, and unsubscribe on cleanup; `resolveInteractionScrollBehavior` maps explicit smooth scrolling to auto in reduced mode. There is no global preference store or provider.

`feedback.ts` defines an ephemeral operation/event identity, phase, authority, semantic roles and preference/capability policy. Its exported sink is a no-op. The authoritative owner must emit once at the relevant state transition; this foundation does not deduplicate events or claim exactly-once delivery. It retains/logs no payload, and initializes no platform/audio/haptic API.

## Numeric and easing tokens

Device/input mode for all migrated measurements: desktop 1440 × 900 and mobile 390 × 844 browser viewports, forced CSS state endpoints. Native Enter/Space were additionally checked in isolated production-CSS fixtures. No actual phone/coarse-pointer/perception calibration was performed.

| Token | Value | Unit | Status | Source baseline | Consumer | Normal behavior | Reduced behavior | Method / rationale / test status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `motion.response.dashboardState` | 150 | ms | EXISTING_BASELINE | `app/dashboard/val-design.css:58-64` | Start message + through control.standard; state.press/release resolve the same baseline | 150 ms for each inherited transition property | transition none / 0 s through the scoped policy | SOURCE-DERIVED plus ISOLATED STYLE PROBE where current mapping applies. Recipe/bridge tests pass; normal endpoints match before/after; reduced suppression measured. |
| `motion.response.sharedState` | 140 | ms | EXISTING_BASELINE | `app/globals.css:5114-5125` | Inventory only; original owner is not migrated | Underlying shared-control declaration, overridden on dashboard buttons. Inventory only. | Original owner's rules retained | SOURCE-DERIVED plus ISOLATED STYLE PROBE where current mapping applies. Schema/unit/provenance validation passes; no device tuning. |
| `motion.response.railState` | 140 | ms | EXISTING_BASELINE | `app/dashboard/val-design.css:897-909` | Inventory only; original owner is not migrated | Separate existing rail mapping; not migrated. | Original owner's rules retained | SOURCE-DERIVED plus ISOLATED STYLE PROBE where current mapping applies. Schema/unit/provenance validation passes; no device tuning. |
| `motion.response.controlEasing` | ease | css-easing | EXISTING_BASELINE | `app/dashboard/val-design.css:63` | Start message + through control.standard; state.press/release resolve the same baseline | Existing ease curve | transition none / 0 s through the scoped policy | SOURCE-DERIVED plus ISOLATED STYLE PROBE where current mapping applies. Recipe/bridge tests pass; normal endpoints match before/after; reduced suppression measured. |
| `motion.structural.legacySheetEnter` | 500 | ms | EXISTING_BASELINE | `app/dashboard/mobile.css:181` | Inventory only; original owner is not migrated | Inventory only. Sampled slightly underdamped curve, not the proposed critical rest. | Original owner's rules retained | SOURCE-DERIVED inventory; sheet duration also visible in isolated computed styles. Schema/unit/provenance validation passes; no device tuning. |
| `motion.travel.legacySheetEnter` | 32 | css-px | EXISTING_BASELINE | `app/dashboard/mobile.css:603-625` | Inventory only; original owner is not migrated | Inventory only. No sheet migration or new solver. | Original owner's rules retained | SOURCE-DERIVED inventory; sheet duration also visible in isolated computed styles. Schema/unit/provenance validation passes; no device tuning. |

Shared and rail durations intentionally remain different named mappings even though both currently contain 140 ms. The shared base is overridden on dashboard controls. These inventory records do **not** make JSON authoritative for the unmigrated runtime: their existing source literals remain until a separately authorized migration. Likewise the legacy sheet records do not select a new critical-rest curve or copy its numeric solver model into control recipes.

No proposed numeric placeholder, artificial input delay, timing multiplier, latency budget or new gesture threshold was added. Gesture namespaces, pending/confirmed durations, structural exit/settle targets and solver tolerances remain absent until their consumers are scoped. Existing 180 ms voice-save debounce, polling/signaling/ICE deadlines and audio-analysis thresholds are subsystem behavior and are not tokenized.

## Semantic material values

Unit for every cell below: **semantic policy** (no physical unit). Each family's complete resolved values are shown; its explicit inheritance is in JSON. Every family has status **PROPOSED_UNCALIBRATED**, source `docs/doshab-interaction-physics-v1.md#material-model` and/or `#mass-families`. These are v1 design contracts, not claims that unmigrated product operations already implement them.

Consumer: only STANDARD describes the migrated control. Other families are foundation contracts. Normal behavior stays with the current component; reduced mode removes optional motion without changing any action authority/meaning. Measurement: SOURCE-DERIVED from the proposal; inherited-property and invalid-data tests pass. Rationale: distinguish consequence, commitment and recovery without inferring numeric mass from animation time. Device/input mode: policy applies across inputs; only the first consumer has isolated browser checks.

| Property / token suffix | material.STANDARD | material.LIGHT | material.STRUCTURAL | material.HEAVY | material.CRITICAL |
| --- | --- | --- | --- | --- | --- |
| `mass` | STANDARD | LIGHT | STRUCTURAL | HEAVY | CRITICAL |
| `stiffness` | bounded | bounded | bounded | bounded | bounded |
| `damping` | not-applicable | not-applicable | critical-rest | not-applicable | not-applicable |
| `friction` | normal | minimal | normal | deliberate | confirm |
| `activationThreshold` | native-click | native-click | existing-surface-action | explicit-control | explicit-confirmation |
| `travel` | existing-control | recipe-specific | recipe-specific | recipe-specific | recipe-specific |
| `snap` | origin | origin | existing-destination | origin | origin |
| `momentum` | none | none | none | none | none |
| `reversibility` | cancel-before-commit | local-reversal | interruptible | operation-specific | irreversible-after-authority |
| `latencyBehavior` | immediate-acknowledgement | immediate-acknowledgement | immediate-acknowledgement | immediate-acknowledgement | immediate-acknowledgement |
| `failureBehavior` | preserve-context | preserve-context | preserve-context | retain-session | preserve-context-no-auto-retry |
| `soundRole` | none | none | none | none | none |
| `hapticRole` | none | none | none | none | none |

STRUCTURAL's `critical-rest` is a proposed character, not the current sheet curve. HEAVY's `deliberate` means an explicit labeled action, never a dwell before mute/leave. CRITICAL confirmation and failure policies are contracts only; no destructive confirmation or server operation is changed in Phase 1. Sound/haptic defaults stay none.

## Other semantic tokens

All entries in this table use unit **semantic policy**, have no numeric duration and apply across input modes. No entry is a new settings UI or a global runtime mutation.

| Token | Value | Status | Source baseline | Consumer | Normal / reduced behavior | Method / rationale / test status |
| --- | --- | --- | --- | --- | --- | --- |
| `accessibility.reducedMotion.transition` | none | EXISTING_BASELINE | app/dashboard/val-design.css:167-169,647-650; docs/doshab-interaction-physics-v1.md#accessibility-behavior | Start message CSS bridge | Normal retains the owner's existing behavior; reduced transition = none | Existing suppression policy, extended with the v1 semantic contract; not a claim that all existing JS/gestures comply. Scoped probe and bridge tests pass. |
| `accessibility.reducedMotion.transform` | none | EXISTING_BASELINE | app/dashboard/val-design.css:167-169,647-650; docs/doshab-interaction-physics-v1.md#accessibility-behavior | Start message CSS bridge | Normal retains the owner's existing behavior; reduced transform = none | Existing suppression policy, extended with the v1 semantic contract; not a claim that all existing JS/gestures comply. Scoped probe and bridge tests pass. |
| `accessibility.reducedMotion.scrollBehavior` | auto | EXISTING_BASELINE | app/dashboard/val-design.css:167-169,647-650; docs/doshab-interaction-physics-v1.md#accessibility-behavior | Explicit opt-in JS resolver; no existing scroll consumer migrated | Normal retains the owner's existing behavior; reduced scrollBehavior = auto | Existing suppression policy, extended with the v1 semantic contract; not a claim that all existing JS/gestures comply. Policy resolution tests pass; application-wide behavior remains unmigrated. |
| `accessibility.reducedMotion.settle` | immediate | EXISTING_BASELINE | app/dashboard/val-design.css:167-169,647-650; docs/doshab-interaction-physics-v1.md#accessibility-behavior | Declarative policy for future consumers | Normal retains the owner's existing behavior; reduced settle = immediate | Existing suppression policy, extended with the v1 semantic contract; not a claim that all existing JS/gestures comply. Policy resolution tests pass; application-wide behavior remains unmigrated. |
| `accessibility.reducedMotion.loops` | static | EXISTING_BASELINE | app/dashboard/val-design.css:167-169,647-650; docs/doshab-interaction-physics-v1.md#accessibility-behavior | Declarative policy for future consumers | Normal retains the owner's existing behavior; reduced loops = static | Existing suppression policy, extended with the v1 semantic contract; not a claim that all existing JS/gestures comply. Policy resolution tests pass; application-wide behavior remains unmigrated. |
| `accessibility.reducedMotion.directManipulation` | track | EXISTING_BASELINE | app/dashboard/val-design.css:167-169,647-650; docs/doshab-interaction-physics-v1.md#accessibility-behavior | Declarative policy for future consumers | Normal retains the owner's existing behavior; reduced directManipulation = track | Existing suppression policy, extended with the v1 semantic contract; not a claim that all existing JS/gestures comply. Policy resolution tests pass; application-wide behavior remains unmigrated. |
| `feedback.soundRole` | none, detent, latch, structural-join, warning, failure | PROPOSED_UNCALIBRATED | docs/doshab-interaction-physics-v1.md#material-model | Typed no-op event contract; no product emitter added | No sensory output in either mode | SOURCE-DERIVED vocabulary; no-op API safety test passes without browser APIs; no private data read/logged. |
| `feedback.hapticRole` | none, selection, commit, warning, failure | PROPOSED_UNCALIBRATED | docs/doshab-interaction-physics-v1.md#material-model | Typed no-op event contract; no product emitter added | No sensory output in either mode | SOURCE-DERIVED vocabulary; no-op API safety test passes without browser APIs; no private data read/logged. |
| `state.localOpen.authority` | local-state | EXISTING_BASELINE | components/messages/messages-page-client.tsx:36-48,120 | Existing Start message handler; descriptive record only | Same immediate local action in both modes | SOURCE-DERIVED; component test verifies immediate local open with no pointer/key override or motion callback. |
| `state.localOpen.activation` | native-click | EXISTING_BASELINE | components/messages/messages-page-client.tsx:36-48,120 | Existing Start message handler; descriptive record only | Same immediate local action in both modes | SOURCE-DERIVED; component test verifies immediate local open with no pointer/key override or motion callback. |
| `state.localOpen.scheduling` | independent-of-motion | EXISTING_BASELINE | components/messages/messages-page-client.tsx:36-48,120 | Existing Start message handler; descriptive record only | Same immediate local action in both modes | SOURCE-DERIVED; component test verifies immediate local open with no pointer/key override or motion callback. |
| `state.localOpen.failure` | preserve-context | EXISTING_BASELINE | components/messages/messages-page-client.tsx:36-48,120 | Existing Start message handler; descriptive record only | Same immediate local action in both modes | SOURCE-DERIVED; component test verifies immediate local open with no pointer/key override or motion callback. |

## Recipe register

Recipe metadata lives in typed TypeScript; all numeric response values are references to JSON. The adapter refuses PROPOSED_UNCALIBRATED response duration/easing values. Recipes never submit, delay or undo an operation.

| Recipe | Status / material | Values / normal behavior | Reduced behavior | Consumer / tests |
| --- | --- | --- | --- | --- |
| `control.standard` | EXISTING_BASELINE response; STANDARD semantic family remains proposed | dashboardState + controlEasing, native click | explicit reduced policy, same activation | Start message + only; component/recipe/CSS tests and isolated style/input checks pass |
| `state.press` | EXISTING_BASELINE response / STANDARD | Same extracted dashboard response, visual acknowledgement only | same reduced policy | Named future adapter contract; resolver tested; no independent runtime consumer |
| `state.release` | EXISTING_BASELINE response / STANDARD | Same finite return, no completion callback | same reduced policy | Named future adapter contract; resolver tested; no independent runtime consumer |
| `control.light` | PROPOSED_UNCALIBRATED / LIGHT | Existing owner; response=null, no invented duration | policy resolution only | No migration; tests verify null response |
| `surface.structural` | PROPOSED_UNCALIBRATED / STRUCTURAL | Existing focus/history owner; response=null | policy resolution only | No sheet change; tests verify null response |

## Calibration and release record

- Candidates compared: only **existing normal behavior versus extracted identical values**. No alternate timing/curve was tested or selected.
- Normal result: property list, effective duration/easing, dimensions, typography/colors/borders/shadows/padding, opacity, focus and press/hover endpoints matched in the isolated probe. New inline longhands serialize one repeated duration/easing instead of three identical list entries.
- Reduced result: Start message transition becomes none/0 s and transform none; rest geometry and focus/action meaning remain. Other sampled controls' styles are unchanged. Existing motion conflicts remain outside this first consumer.
- Performance/latency and perceived weight: not measured. Continuous loader phases were not used for before/after equality; no performance claim or device calibration status is assigned.
- Production import/chunk inspection and native isolated Enter/Space checks passed. No authenticated application control could be measured because the configured PostgreSQL endpoint was down. The optional native RTP integration test was not run; it requires an external native WebRTC module/live signaling and is outside this control migration. All existing package test scripts passed.
- Automated verification: lint exit 0; TypeScript exit 0; 61 existing + 10 new tests passed; production build exit 0. Exact commands/counts and limitations are in the baseline document.
- Scope review: changes are the six `lib/interaction/` foundation files, scoped CSS, one component's opt-in, one package test script, two test files, and the baseline/calibration documents. No schema/API/route/transport, media/provider lifecycle, message/preference/notification state, destructive confirmation, navigation or gesture changes.
- Temporary probe decision: discard the one-off server and raw captures after preserving the measured results here/in the baseline; keep the focused unit/integration-contract tests. No disposable probing file is intended to ship.
- Rollback boundary: remove the single component opt-in/import and its style constant to return it to the old cascade; unused foundation files have no side effects or global style activation.
- **Acceptance: PARTIAL**, due to authenticated runtime verification still outstanding, not a known failing foundation test. No Phase 2 work has begun. It is not yet safe to treat this as fully accepted for Phase 2 implementation: make the configured local PostgreSQL instance available and check the hydrated chooser, focus return, touch and live reduced preference in-app first, then separately authorize Phase 2.

## Files changed in Phase 1

| File | Purpose |
| --- | --- |
| `lib/interaction/tokens.json` | Canonical values, family inheritance and provenance |
| `lib/interaction/types.ts` | Material, recipe, phase and preference contracts |
| `lib/interaction/validation.ts` | Strict token validation and complete family resolution |
| `lib/interaction/recipes.ts` | Named recipes, custom-property bridge and explicit JS scroll policy |
| `lib/interaction/preferences.ts` | SSR-safe preference read and live subscription cleanup |
| `lib/interaction/feedback.ts` | Semantic event contract and no-op sink |
| `app/interaction-physics.css` | Opt-in timing extraction and scoped reduced-motion repair |
| `components/messages/messages-page-client.tsx` | Start message + opt-in only |
| `package.json` | `test:interaction` script; no dependency changes |
| `tests/interaction-physics.test.mjs` | Ten targeted foundation and consumer-contract tests |
| `tests/helpers/interaction-module.mjs` | Isolated TypeScript module loader for those tests |
| `docs/doshab-interaction-baseline.md` | Measurements, authority, comparison and verification limits |
| `docs/doshab-interaction-calibration.md` | This register and implementation/acceptance record |

Pre-existing changes, including `docs/val-music-settings-fixes.md`, the audit/proposal and other untracked work, were preserved. No commit or deployment was performed.

## AUTHENTICATED RUNTIME VERIFICATION

2026-10-07 continuation; see the [authenticated runtime record](doshab-interaction-baseline.md#authenticated-runtime-verification) for measurements, sequence and remaining checks. Previous isolated-probe evidence and calibration decisions above are preserved.

| Evidence class | Result |
| --- | --- |
| AUTHENTICATED APP / environment | Existing PostgreSQL 18.3 cluster on 127.0.0.1:55432 started with its recorded arguments; Prisma read-only `SELECT 1` passed. Real Next.js development Messages route loaded in Opera/Chromium using the existing Test-account session. No database/authentication change or mock data. |
| AUTHENTICATED APP / desktop normal | 1440 x 900 viewport; actual reduced-motion query false and coarse-pointer query false. Start message measured **141.140625 x 40 px**, transform none, opacity 1, transition **150 ms / ease** over the inherited property list. Dimensions and position remained the same after the keyboard open/close sequence. No authenticated pre-migration screenshot comparison was performed. |
| AUTHENTICATED APP / input and chooser | Enter opened one visible dialog. Focus entered its header close button; Tab traversed both close controls and friend search, then wrapped. Escape closed it. A later pointer click opened one visible chooser and focused the header close button. Exact handler counts, held press/release endpoints, Space, complete focus-visible verification and repeated cycles remain untested. |
| AUTHENTICATED APP / focus limitation | After Enter/Tab/Escape, focus was observed on the page rather than Start message. Attribution is unresolved. The chooser and native click handler were not changed by Phase 1; reproduce/compare before considering any fix. No repair was made. |
| Mobile / EMULATED TOUCH | Authenticated 390 x 844 verification was not reached. **TOUCH AUTHORITY = NOT TESTED.** Prior isolated fixtures are not real-app touch or device evidence. |
| LIVE OS REDUCED MOTION | Not tested; no confirmed OS switch. Complete normal desktop/mobile checks first, then ask the user to turn Animation effects off, wait for confirmation, and later request restoration unless reduced motion is their normal setting. |
| LIVE PREFERENCE SUBSCRIPTION | Not verified. The CSS media query drives this control. The exported JS subscription helper has no mounted production consumer; its prior unit tests do not prove a live OS/browser transition or provider continuity. |
| SOURCE-DERIVED / scope | One component opt-in and one scoped CSS import; actual DOM also showed exactly one recipe attribute. Local click scheduling and provider/network/media/message/navigation code are unchanged. Their runtime regression checks and final console review remain incomplete. |
| NOT TESTED / interruption | Browser automation became unavailable after the interruption. Replacement Computer Use failed before attachment because Node v22.17.0 is below its >= v22.22.0 requirement. Existing local services were restarted after the interruption using their known configuration; mounted continuity across this interruption is not evidence for the live-preference test. |

No token values, mass semantics, timing, easing, normal travel or product code changed. No perceptual calibration was added. No code fix warranted rerunning lint, TypeScript, tests or build; earlier automated results remain historical. Only the baseline and this register were appended during runtime acceptance.

**PHASE 1 ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2: NO.** The database blocker is resolved; browser tooling and the outstanding authenticated checks, including the focus-return observation, must be addressed before acceptance. Phase 2 has not begun.

### Resume prerequisite check — 2026-10-07

The cluster remained running and the dev server returned HTTP 200 for `/login`. Computer Use still rejected the installed Node v22.17.0 before browser attachment, including after a kernel reset; its required version is >= v22.22.0. No runtime-path override was configured. The user was asked for the newer executable path or confirmation of an update; no new authenticated, touch or reduced-motion observations were obtained in this attempt.

**SOURCE-DERIVED:** the unmigrated `Start a conversation` button opens the same unchanged DialogSurface, providing a direct comparison for the outstanding focus sequences. **Focus classification remains D: UNRESOLVED**, not an established Phase 1 regression. No code/token/settings changes or automated application checks were made. Previous evidence is unchanged; **Phase 1 PARTIAL / Phase 2 NO** remains the current decision.

### Tooling update — 2026-10-07

Node is now **v24.21.0** and JavaScript execution succeeds; the previous version blocker is resolved. PostgreSQL remained available, and the restarted dev server returned HTTP 200. Computer Use failed before attachment because its service was not recognized within the running connection's trusted module configuration. The installed package and updated on-disk configuration were verified; a full Codex restart was requested to reload the connection. No trust settings or product code were changed, and no new browser measurements were obtained. **Acceptance remains PARTIAL / Phase 2 NO** pending the same outstanding runtime checks.

### Authenticated normal-motion continuation — 2026-10-07 to 2026-10-08

Browser control recovered after the restart. See the [normal-motion continuation](doshab-interaction-baseline.md#authenticated-normal-motion-continuation--2026-10-07-to-2026-10-08) for sequences and qualifications. No calibration value or product code changed.

| Evidence class | Current result |
| --- | --- |
| AUTHENTICATED APP / desktop pointer | 1440 x 900; reduced false. Rest **141.140625 x 40 px**, 150 ms / ease. Hover Y -1 px and held press Y +1 px preserve the existing travel; dimensions are stable, but the button's transformed hit bounds also move by 1 px. Release opens one chooser; drag-off cancellation opens none. |
| AUTHENTICATED APP / keyboard and lifecycle | Enter and Space each open one chooser. Native focus-visible is 2 px / 3 px offset; Tab containment, Escape and close activation work. Repeated cycles show no duplicate visible dialog or stuck background. Exact listener/handler counts were not measured. |
| AUTHENTICATED APP / focus classification | **B: pre-existing DialogSurface behavior in this dev/browser environment.** BODY receives focus after all tested migrated close sequences; the unmigrated Start a conversation opener reproduces it. Shared focus code is unchanged. The underlying cause remains undiagnosed, and no out-of-scope repair was made. |
| AUTHENTICATED APP / mobile viewport | Real Messages route at 390 x 844, reduced false, coarse false: **141.140625 x 48 px**, 150 ms / ease, no horizontal document overflow. Pointer/Enter/Space open once; close/Escape/Back restore inert count to zero. Settled sheet fits inside the viewport with an 8 px bottom inset. This is fine-pointer viewport evidence. |
| EMULATED TOUCH | Pending user DevTools Mobile/touch setup and confirmation; no touch authority established yet. Real-device safe areas, keyboard and touch scrolling remain unverified. |
| LIVE OS REDUCED MOTION / LIVE PREFERENCE CHANGE | Pending. The requested OFF handoff follows completion of normal touch testing; it has not yet occurred. CSS runtime evidence must remain separate from the unused, unit-tested JS subscription helper. |
| SOURCE-DERIVED / scope | Sole control opt-in, click handler, DialogSurface and provider ownership remain unchanged. Final console/navigation/continuity review is outstanding. |

Only the baseline and this register were appended. No automated application checks were rerun because no code changed. **PHASE 1 ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2: NO.**

### Emulated-touch setup — 2026-10-08

The user confirmed `mobile`; the authenticated tab now reports **coarse pointer true** at **390 x 844**, reduced motion false. **TOUCH AUTHORITY = EMULATED**. Start message remains **141.140625 x 48 px**, 150 ms / ease, transform none, with no horizontal document overflow. Browser click dispatch timed out through both documented input paths; subsequent inspections showed no chooser or stuck press/inert state. These are tooling failures, not successful touch tests or established product regressions. Manual tap/chooser inspection was requested and remains pending.

The current tab's captured warning/error console list was empty; scope review still shows one consumer and two opt-in CSS rules. No calibration, code or automated-check changes. Normal touch completion precedes the required OS OFF handoff. **PHASE 1 ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2: NO.**

After the user's manual tap and `open` reply, authenticated inspection showed one chooser, close-button focus, six inert background siblings and unchanged Start message geometry. The settled 374 x 247 px sheet fit within the viewport with no content overflow; warning/error capture remained empty. **EMULATED TOUCH: manual activation observed; close/repeated cycles/scroll confirmation pending.** Automated input dispatch is still unavailable in this mode. Live OS preference work has not begun; acceptance remains PARTIAL / Phase 2 NO.

### Normal mobile completion and OS handoff — 2026-10-08

The user confirmed `closed`, with no problem reported after the requested two further single-tap open/close cycles and scrolling check. These cycles/scrolling are **EMULATED TOUCH / USER-REPORTED**; direct authenticated inspection confirms zero dialogs/inert elements, stable 141.140625 x 48 px geometry, one recipe, no horizontal document overflow and an empty captured warning/error console list. Hardware safe areas, on-screen keyboard and rich-content scrolling remain outside this empty-account emulation.

The mounted page now has temporary local search/sort markers (`phase1-continuity` / `name`) for continuity inspection. Its reduced query is false and normal timing remains 150 ms / ease. The user was asked for Windows Animation effects OFF and an explicit `off` reply; reduced-motion testing has not begun. No token/code/check changes. **Phase 1 PARTIAL / Phase 2 NO** pending live preference and final regression verification.

### Live OS reduced-motion verification — 2026-10-08

After the user's explicit `off` reply, the real browser reduced-motion query was **true**. The mounted Messages page responded without reload/navigation: the opted-in control changed from 150 ms / ease to **none / 0 s**, transform none; local search/sort markers survived. **LIVE PREFERENCE CHANGE: PASS for CSS.** The unused JS subscription helper remains separate unit-test evidence.

| AUTHENTICATED APP + LIVE OS REDUCED MOTION | Result |
| --- | --- |
| 390 x 844 | Stable **141.140625 x 48 px**, unchanged position/label through held native press and release. Pointer, Enter and Space each open one chooser; close/Escape/keyboard close restore zero dialogs/inert siblings. Existing sheet reduced animation is none / 0 s and its geometry remains within the viewport. |
| 1440 x 900 | Stable **141.140625 x 40 px** through active/hover states, no transform travel. Pointer, Enter and Space open once; keyboard focus-visible remains 2 px solid / 3 px offset. Focus return remains existing classification B. |
| Scope/console/continuity | One recipe; unmigrated Start a conversation still computes to legacy 150 ms / ease under reduced motion. Captured warning/error list empty. Local search/sort survived preference/viewport/chooser changes. |

DevTools was closed before reduced testing; the input authority for those checks is browser-native fine pointer/keyboard, distinct from the earlier manual touch emulation. **SOURCE-DERIVED:** provider keys/lifetimes and message/call/music owners are unchanged. Lifecycle counts and active media sessions were not tested. No code/token tuning or automated-check rerun was required. The user was asked to restore ON (or explicitly keep their usual OFF preference); restoration and final navigation review remain pending. **Phase 1 PARTIAL / Phase 2 NO** until completion.

## Final Phase 1 runtime acceptance

Completed **2026-10-08** after the user's explicit `on` reply. See the [final baseline result](doshab-interaction-baseline.md#final-phase-1-runtime-acceptance) for every required field, sequence and limit.

| Evidence class | Accepted result |
| --- | --- |
| AUTHENTICATED APP / input | Desktop normal/reduced pointer, Enter, Space and chooser containment/cleanup pass. Normal 1 px legacy transform/hit-bound movement remains unchanged; reduced travel is none. Focus restoration remains classification **B**, reproduced with the unmigrated opener, rather than a Phase 1 regression. |
| EMULATED TOUCH | 390 x 844 real authenticated layout/manual activation inspected; repeated single-tap cycles and scrolling confirmed by the user. One chooser, stable 141.140625 x 48 px button, no horizontal overflow and final inert cleanup. Automated touch dispatch failures are excluded from passed evidence; no physical-device claim. |
| LIVE OS REDUCED MOTION / LIVE PREFERENCE CHANGE | Actual query true after OFF; none / 0 s / no transform and functional pointer/Enter/Space at desktop/mobile sizes. Query false after ON; **150 ms / ease restored** with unchanged 141.140625 x 40 px desktop and 141.140625 x 48 px mobile geometry. Local search/sort survived both OS changes without reload/navigation. CSS consumer passes; unused JS helper remains unit-tested only. |
| AUTHENTICATED APP / navigation and shell | Messages -> usable Spaces -> Messages works through existing links. Recipe count zero on Spaces, one on Messages. PeopleRail's local search survived the return route change, supporting shell-subtree continuity. Source provider keys/ownership are unchanged; internal lifecycle counts and active media are unverified. |
| CONSOLE / scope | Final authenticated warning/error capture empty. No new global selector, transition migration, message/media/routing/provider/transport/schema change or identified Phase 1 regression. |

All temporary local search/sort markers were cleared, the viewport override was reset and Windows Animation effects was restored ON. Only the baseline and this register changed during runtime acceptance; the Phase 1 implementation and unrelated work remain untouched. Documentation whitespace checks passed (exit 0). No application checks were rerun because no code changed; prior lint/TypeScript/build and 71 passing tests remain the last recorded results.

**No calibration values/statuses changed. No token is newly CALIBRATED.** Real device/accessibility, populated conversation, active media, internal provider-lifecycle, authenticated pre-migration visual comparison and latency/frame/perception evidence remain outside this acceptance. Existing focus-return classification B remains documented.

**PHASE 1 ACCEPTANCE: PASS. SAFE TO BEGIN PHASE 2: YES.** Readiness does not begin implementation. **Phase 2 has not begun; no user action remains for Phase 1 acceptance.**

## Phase 2A messaging certainty — 2026-10-08

See [the Phase 2A report](doshab-phase2a-messaging-certainty.md) for the before/after lifecycle, authority boundaries, race/failure tests, runtime samples and rollback.

- **Implemented semantic behavior:** immediate memory-owned intent; Sending / Saved / Not sent / Unconfirmed; valid HTTP 201 storage authority; known pre-write failure versus unknown POST outcome; original row identity/content/reply retained; newer drafts untouched; account/channel ownership and account-unmount guard. No timing/easing/travel token was introduced or tuned.
- **AUTHENTICATED RUNTIME:** desktop Enter submit, consecutive sends with a newer draft, route return and 390 × 844 pending → confirmed. Final mobile row geometry and scroll position were identical through acknowledgement; composer stayed 366 × 65 px and send target 48 × 48 px. Status computed to 11 px / 16 px with inherited color and .7 opacity after avoiding legacy paragraph selectors. This is a functional style choice, not a motion/perception calibration.
- **AUTOMATED TEST / EMULATED NETWORK:** 19 new behavior tests; final total 90 passing tests. Lint, explicit TypeScript and production build pass. Delayed, rejected, lost-response, stale/out-of-order, duplicate echo, route/account and draft cases exercised through production logic with controlled dependencies.
- **Limits:** exact lost-receipt-to-SSE correlation is unavailable without a separate protocol decision; unknown local intent and independently stored history can coexist. No Retry/automatic resend or content/time/ciphertext matching. Browser fault modes, physical touch/keyboard, assistive speech and performance traces remain unmeasured. Mobile runtime used an emulated viewport and fine-pointer input, not emulated touch. One development Fast Refresh full-reload warning during editing; no captured errors.
- Phase 1 implementation and approved motion values remain unchanged. **No token is newly CALIBRATED. PHASE 2A: PARTIAL. SAFE TO BEGIN PHASE 2B: NO.** No later phase began.

### Phase 2A acceptance-only review — 2026-10-08

- **CORRELATION DECISION: ACCEPTED LIMITATION FOR 2A.** Re-read intent/POST/Prisma/bus/SSE/encryption ownership: no durable intent identifier survives to SSE without the POST receipt. Local UUIDs are memory-only; server IDs are generated at storage. No text/time/ciphertext/order inference was used. Unknown intent and independently authoritative history may coexist. The explicit `Unconfirmed · Don't resend` label, preserved text/reply, absent Retry/automatic resend and exact-ID normal reconciliation make this an acceptable no-retry v1 limitation. A later promise of exact lost-receipt reconciliation or safe retry needs a separate reviewed protocol design. This decision is based on the implemented/tested contract; the actual fault/coexistence screen remains unobserved.
- **ADDITIONAL AUTHENTICATED RUNTIME:** three rapid native Enter sends in local Test/demo `#general`; B/C concurrently pending, then three Saved rows and no sampled duplicate echo. Newer unsent draft survived completion and Messages → original channel return. Messages had no channel operations; return retained exactly the three server IDs and twelve total rows, with no old confirmation in the live region. Unresolved route/account/another-channel runtime checks remain open.
- **390 × 844 / FINE POINTER, NOT TOUCH:** wrapped row content within 332 px; 16 px status footers, 11 px status text. Feed settled at bottom (904 + 548 = 1452). After route return composer 366 × 65 px at x=12/y=699, Send 48 × 48 px at x=322/y=708; no document horizontal overflow. Filled-input automation first scrolled the page root to focus the composer; return restored root scrollTop 0 and the normal composition. [Contextual screenshot](../.codex-temp/phase2a-acceptance-rapid-return.jpg).
- **ACCESSIBILITY / LIMITS:** AX exposed pending and server-storage-only confirmation; native keyboard retained focus. Sampled live region did not replay on later inspection or remount. No screen-reader speech or full mutation trace. Current motion preference was normal; status animation none / transition 0 s. Failed/unknown browser layouts and actual reduced-mode fault behavior remain unverified.
- **AUTHENTICATED FAULTS STILL OPEN:** browser tool has no network throttling/interception/offline capability; native DevTools control is unavailable. Manual slow-network handoff requested, not yet completed. No artificial slow request, controlled rejection, interrupted receipt or network recovery is claimed from the normal samples or automated dependencies. No product/server code was changed to manufacture failures.
- **QA / VALIDATION:** no supported local-message cleanup path found; all nine clearly labeled QA messages remain in the self-only local channel. No ad hoc deletion or non-test mutation. Temporary unsent draft cleared; viewport override reset. Documentation and two local screenshots only; explicit whitespace/local-link validation and scoped `git diff --check` passed (exit 0). Prior 90 tests/lint/typecheck/build remain the last application checks, with no unnecessary rerun. No tokens or calibration statuses changed.

**PHASE 2A ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2B: NO.** The outstanding requirement is authenticated fault-mode acceptance, not an unapproved architecture migration. No later phase began. See the [acceptance-only report](doshab-phase2a-messaging-certainty.md#acceptance-only-review--2026-10-08) for the product decision, precise evidence and remaining manual handoff.

### Manual fault acceptance: Test 1 preparation — 2026-10-08

User-directed staged handoff: keep correlation accepted; wait for each manual setting confirmation and restore conditions before advancing. Unsafe runtime reproduction of a known rejection may use the existing automated authority without blocking acceptance solely for that case.

Authenticated Test/demo `#general` at 1440 × 900: empty draft, zero pending/unknown sends, twelve rows. A fresh existing Pinned messages fetch succeeded; dialog closed. Feed moved to bottom (663 + 516 = 1179). Composer 802.8125 × 100.4375 px at x=439.59375/y=783.96875; Send 54 × 54 px at x=1166.40625/y=797.96875. No horizontal overflow; operation live region empty; no offline notice. [Baseline screenshot](../.codex-temp/phase2a-manual-slow-baseline.jpg).

**Awaiting `slow`:** user asked to select DevTools Network Slow 3G or the slowest existing built-in profile, with device emulation off and no send/reload yet. No slow-send evidence claimed before confirmation; no new QA message, application change, test rerun or calibration tuning. Phase 2A remains PARTIAL; Phase 2B has not begun.

### Test 1 resumed: slow profile confirmed — 2026-10-08

User replied `slow` after the separate sidebar-image settings change. The network preset is **USER-REPORTED**, not directly observable through browser tooling. Returned from Home to authenticated Test/demo `#general`; a fresh existing Pinned read succeeded and its dialog was closed. Current viewport is 1868 × 918 CSS px, twelve stored rows, empty composer, no unresolved operation and an empty atomic status. Feed is at bottom (620 + 546 = 1166), composer frame 1230.8125 × 100.4375 px, Send 54 × 54 px; no document horizontal overflow or captured console warning/error. This refresh replaces the earlier geometry for the upcoming send, without changing any token.

Prepared `Phase 2A slow send — local QA.` without submitting it. Requested one manual send followed immediately by the newer unsent draft `Phase 2A slow newer draft — keep unsent.` and a `sent` reply. **Manual send pending; no slow-send result claimed.** An observation window found no pending row, and the next inspection still showed the prepared draft/twelve rows; this is not a failed-send result. [Prepared handoff](../.codex-temp/phase2a-slow-prepared.jpg).

Preparing/focusing the draft caused the existing outer channel scroller to move 313 px before any send. An existing Pinned open/close restored outer scrollTop 0 and the baseline composer position while preserving the prepared draft. Final prepared feed scrollTop 592 is 28 px from bottom. This is pre-submit focus behavior, not a confirmation-driven shift.

No implementation/test changes or check rerun in this stage; prior appearance verification was 95 tests plus lint/TypeScript/build passing. No calibration value/status changed. Network restoration remains a later, explicitly confirmed step. **Phase 2A PARTIAL; Phase 2B not begun.**

### Test 1: manual send inspected, pending interval missed — 2026-10-08

User replied `sent`; the first inspection already showed one **Saved** row for `Phase 2A slow send — local QA.`, server ID `cmuzrbped000i4c7i2e75fy1z`. The exact newer unsent draft remains, with composer/Send enabled. Thirteen stored rows (three original + ten QA), one target at first/later samples and unchanged `Message saved on server.` atomic status; no sampled extra SSE echo or repeated announcement. Console warning/error capture empty. [Confirmed result](../.codex-temp/phase2a-slow-observed.jpg).

User reported **`I didn't catch the pending state`**. Pending visibility, pre-completion row presence, simultaneous newer typing and pending-to-confirmed continuity are **not authenticated slow-send evidence yet**. Do not substitute normal-runtime or automated checks. **Test 1 PARTIAL.**

Actual viewport changed from 1868 × 918 to 1868 × 944. Target row 1176.8125 × 84.625 px, composer frame 1230.8125 × 100.4375 px, Send 54 × 54 px. Feed 674 + 572 = 1246 of 1251 (5 px from bottom); outer scrollTop 0 and no horizontal document overflow. Changed viewport precludes a confirmation-only position comparison.

Requested **No throttling / Online** and `normal`, retaining this channel/newer draft. Awaiting that explicit restoration before advancing; Test 1 still needs its pending observation. Source-only next-stage review found no safe normal-UI authenticated rejection without invalid-envelope manipulation, auth/membership changes or excessive rate-limit writes; no runtime failure was induced. Two documents/evidence only, scoped whitespace check pass; no application check rerun, token tuning or Phase 2B work. **Phase 2A PARTIAL; safe to begin Phase 2B NO.**

### Test 1 restored, pending-capture readiness handoff — 2026-10-08

User confirmed `normal`; fresh Pinned read succeeded, dialog closed. Thirteen stored rows, same single confirmed slow-QA ID, no unresolved operations. The previous newer temporary draft was intact before deliberately preparing `Phase 2A slow pending capture — local QA.`; no send performed. Current 1868 × 918 viewport: composer 1230.8125 × 100.4375 px and Send 54 × 54 px unchanged from same-size preparation; outer scrollTop 0, native feed scroll left the latest row visible at 704 + 546 = 1250 of 1251 (1 px from bottom), no document horizontal overflow.

Requested **Slow 3G / slowest built-in preset**, keep DevTools open with device emulation off, and reply **`ready` plus preset name without sending yet**. Observation will start before the manual send. [Prepared handoff](../.codex-temp/phase2a-slow-retry-prepared.jpg). Still awaiting readiness; no pending evidence or new stored QA message claimed. Documentation/evidence only, scoped whitespace check passed; no application check rerun or token calibration change. **Test 1 / Phase 2A PARTIAL; Phase 2B not begun.**

### Phase 2A acceptance resumed after sidebar rollback — 2026-10-08

Fresh authenticated demo `#general` inspection: thirteen stored rows, empty editable draft, no operation-state rows, empty atomic status, no horizontal overflow. No QA message sent in this resumption. The earlier prepared draft is absent following the intervening sidebar work; the restored pre-redesign visual remains. At 1868 × 918, feed is at bottom (692 + 546 = 1238), outer main scrollTop 0, composer form 1186.8125 × 54 px, Send 54 × 54 px and disabled for the empty draft. These form measurements are not the surrounding frame measurements from earlier entries. [Resumed baseline](../.codex-temp/phase2a-resumed-baseline.jpg).

Requested current DevTools **No throttling / Online** confirmation because the prior `normal` predates the sidebar work and the tools cannot read current network settings. **Awaiting `normal`; no new fault test or send.** Then obtain slow-profile readiness and begin observation before one manual QA send. Documentation/evidence only, no token or runtime change and no repeated application checks. **Phase 2A PARTIAL; safe to begin Phase 2B NO.**

### Normal-network confirmation and pending-capture readiness — 2026-10-08

User confirmed **`normal`**. Fresh Pinned read succeeded and panel closed; prepared the single unsent draft `Phase 2A slow pending capture — local QA.`. Thirteen stored rows, no operation-state rows, empty atomic status, empty captured warning/error list. At 1868 × 918: feed at bottom (692 + 546 = 1238), outer scrollTop 0, no horizontal overflow, composer form 1186.8125 × 54 px, Send 54 × 54 px. [Prepared draft](../.codex-temp/phase2a-normal-ready.jpg).

Requested Slow 3G / slowest built-in preset with device emulation off; awaiting **`ready` plus preset name, without sending** so observation can start before the manual send. No new QA write, fault result, token/runtime change or later phase. Documentation/evidence only; application checks not rerun. **Phase 2A PARTIAL; safe to begin Phase 2B NO.**

### Pending-capture attempt after slow-profile setup — 2026-10-08

User replied **`i did`** to the slow-profile setup request; preset name unspecified and tools cannot inspect DevTools settings. Current pre-send viewport 1319 × 918, thirteen rows, exact prepared QA draft, no operation-state rows, empty atomic status. Composer form 819.8125 × 54 px, Send 54 × 54 px, outer scrollTop 0, no horizontal overflow; feed 3 px from bottom. [Baseline](../.codex-temp/phase2a-slow-armed-baseline.jpg).

Requested one manual send followed by the newer unsent draft. First bounded pending-selector wait expired with draft still unsent. The second wait also missed pending, and sampled confirmed completion; user replied **`sent`**. One confirmed target `Phase 2A slow pending capture — local QA.`, ID `cmuzv0vmr000k4c7i4sulpypl`; fourteen stored rows (three original + eleven QA), one target across completion/follow-up samples, same atomic success status and no captured warnings/errors. Composer/Send positions unchanged at the same viewport; feed at bottom (776 + 546 = 1322), outer scrollTop 0, no horizontal overflow. No input latency, request timing or pending-to-confirmed continuity was measured. [Confirmed result](../.codex-temp/phase2a-second-slow-confirmed.jpg).

Composer is empty and editable; do not infer lost typing without evidence that the newer draft was entered. Asked whether the user saw Sending and whether the newer draft was not entered, disappeared, or was cleared manually. Awaiting those answers, then separate No throttling / Online restoration. No further QA send, runtime/token change, later phase or repeated application checks. **Phase 2A PARTIAL; safe to begin Phase 2B NO.**

User subsequently confirmed **`I only sent; I did not type the newer draft`**. Empty composer is expected; no draft loss observed. Newer typing/preservation was not exercised by this attempt. Still awaiting whether Sending was seen before Saved; no new send or next fault stage.

User answered **`No, I only saw Saved`**. Sending and pending-to-confirmed continuity remain unverified by either observer; **slow-send acceptance PARTIAL**. No artificial display/input/network delay added. Requested separate **No throttling / Online** restoration and `normal` before the lost-response stage; awaiting restoration. No new send or later phase.

### Network restored; lost-receipt preparation — 2026-10-08

User confirmed **`normal`**; fresh Pinned read succeeded and panel closed. Missing slow pending/newer-typing evidence remains PARTIAL. **Known failure: AUTOMATED AUTHORITY / RUNTIME NOT REPRODUCED**, as explicitly permitted: no safe normal-UI pre-write rejection without invalid-envelope manipulation, account/membership changes or excessive rate-limit writes. Existing passing tests remain authority; no such environment/server change or failure was manufactured.

Prepared the unsent **`Phase 2A lost receipt — local QA.`** through the existing Reply action to the preceding QA ID `cmuzv0vmr000k4c7i4sulpypl`. Fourteen stored rows, no new operation. At 1319 × 918, composer form 819.8125 × 54 px, Send 54 × 54 px, no horizontal overflow; feed 10 px from bottom (827 + 485 = 1312 of 1322). Existing focus behavior briefly scrolled outer main 263 px; Pinned open/close restored 0 while preserving reply/draft, before send. [Prepared draft](../.codex-temp/phase2a-lost-receipt-prepared.jpg).

Awaiting the slowest online preset's **exact displayed name**, Offline off, device emulation off, **without sending**. Then observe the message POST before disconnecting; pre-POST device/encryption failure must not be classified as lost receipt. No fault/recovery evidence yet. Documentation/evidence only; no token/runtime change, repeated application checks or later phase. **Phase 2A PARTIAL; safe to begin Phase 2B NO.**

### Publication requested before continuing — 2026-10-09

User explicitly requested production publication of the current work and the profile-photo display change before further phases. Publishing is authorized; Phase 2A remains PARTIAL and no token calibration or fault acceptance is implied. Manual testing stops at the unsent lost-receipt QA draft with its existing reply. No exact throttle preset or lost receipt was established; no production QA send. The existing sidebar photo/fallback remains; Home artwork now uses the same profile image when present. Slow pending/newer-typing and lost-receipt/recovery/route/reduced/mobile fault evidence remains open. **Safe to begin Phase 2B NO.**
