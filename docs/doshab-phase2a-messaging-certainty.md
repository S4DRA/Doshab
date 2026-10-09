# Doshab Interaction Physics Phase 2A: messaging certainty

Implemented and checked 2026-10-08; acceptance-only review continued the same day. **Phase 2A acceptance: PARTIAL. Safe to begin Phase 2B: NO.** The correlation issue is an **ACCEPTED LIMITATION FOR 2A**; authenticated fault and recovery checks remain open. Scope: the existing text-message composer in `RealtimeMessagePanel`, used by Space text channels and direct conversations. Phase 1 is accepted. Poll creation, reactions, settings, notifications, destructive actions and media remain separate owners.

## Current flow (recorded before implementation)

`TextChannelView` keys `RealtimeMessagePanel` by channel ID. Draft text lives in `MessageDraftsProvider` / `createDraftStore`, keyed by account and channel, in dashboard memory only. Reply target, pending rows and send error currently live in the route component.

Submitting clears the draft and reply immediately and inserts a local `pending:<uuid>` row. Device-key lookup and encryption precede the existing JSON POST. Pending is not visibly explained. The POST route authenticates, checks membership and validates input before a Prisma transaction writes the message and notifications. After commit it formats metadata, publishes to the process-local bus, audits and returns the server message. SSE can therefore arrive before the POST response; a post-commit error can also lose the receipt.

SSE and POST merge encrypted messages by server ID. A separate asynchronous decryption effect produces displayed server rows. POST completion removes the local pending row immediately, so replacement can remount, briefly disappear or duplicate an earlier SSE echo. Any caught error removes the pending row, prepends its text to the current draft and restores reply context. This can alter newer typing, loses row identity and cannot distinguish rejection from an ambiguous result. Pending intent is lost on channel unmount; the draft provider survives that unmount.

## Decision boundary

No schema, API, encryption-envelope or transport changes are authorized. Only a valid POST receipt can associate a local operation with a server ID. Content equality, ciphertext equality and timestamp proximity are not correlation mechanisms here. No automatic resend or Retry button will be added.

Exact reconciliation after a lost POST receipt is deferred: the existing protocol cannot establish which later own-author SSE row belongs to an unknown local operation. Preserve both the explicitly unconfirmed intent and authoritative server history rather than guess, hide stored messages indefinitely or invent a rejection. Product decision **A: ACCEPTED LIMITATION FOR 2A**, with the reasoning and runtime evidence limits recorded below. Durable correlation would improve this presentation and is necessary before promising reliable retry/reconciliation; it is not an architecture change required for the current no-retry scope.

## Changed flow and ownership

The native form reads and clears the latest memory draft synchronously, then records a local operation before awaiting device lookup/encryption. A repeated submit sees an empty draft; a newly typed draft establishes a separate operation, even if its text is identical. There is no content-based send deduplication or concurrent-send lock.

`MessageDraftsProvider` still owns the existing draft store. A small adjacent send store now holds operations and composer reply intent under the same account/channel key. Route unmount removes the component subscription without removing that memory. Completion updates the captured store/key, not an unmounted component or another channel's composer. An account key on the existing provider clears that boundary when the signed-in account changes; its cleanup prevents an encryption task from initiating a POST after its owner ends. Normal route changes do not remount this provider. The already existing inner account key continues to govern the media subtree; no media lifecycle callback was changed.

The existing device-key lookup, encryption function, POST body/endpoint, server transaction, bus, SSE and database catch-up are unchanged. A valid HTTP 201 receipt associates the operation with an exact server ID. The original plaintext, reply preview, local display time and React key are retained while server metadata becomes usable. Display order uses the original local time for this operation; timestamps never identify duplicates. Server actions use the confirmed server ID. Unestablished rows cannot invoke reply/reaction/pin/report actions through a local pending ID.

| State | Visible presentation | Authority / transition |
| --- | --- | --- |
| Local intent / pending | `Sending...`, original text and reply | Recorded synchronously before any await. This is acknowledgement, not proof of storage. |
| Confirmed | `Saved` | HTTP 201 with a valid message identity/date/sender and usable reaction shape from this operation's POST. Means **server stored**, not delivered/read. SSE alone cannot identify this local operation. |
| Failed | `Not sent · Text kept` | Device lookup/encryption failed before invoking POST, or the existing route returned its explicit pre-write 400/401/404/429 rejection. Text/reply stay in the row; no automatic composer restoration. |
| Unknown | `Unconfirmed · Don't resend` | POST invocation followed by network loss, unreadable/invalid receipt, an unexpected success status or an unclassified HTTP error such as 500. Storage may already have happened. |

No timeout or minimum wait was added. A browser request that has not settled remains pending. Terminal duplicate/stale callbacks are ignored. No motion-completion callback schedules a mutation, and no new motion token, sound or haptic adapter is used.

## SSE/POST race handling

The existing encrypted server list and decryption cache remain authoritative for incoming history and metadata. Presentation merges exact server IDs and preserves unchanged row references for existing memoization. Mapped receipts render from the operation immediately; no decryption gap precedes confirmation.

While local POST receipts are unresolved, new, unmapped own-author server rows are staged in presentation. Previously known history, mapped rows and other people's messages remain visible. This is a conservative holding policy, not a guessed association. Own-author messages from another device can consequently wait behind an in-flight local send. Staged messages are retained in server state and released when receipts settle. Overlapping sends share their initial known-ID baseline; these baseline arrays are released on completion.

| Case | Result / evidence |
| --- | --- |
| A: POST before SSE | Immediate confirmed local row; later exact-ID echo overlays metadata, retaining its key/content. Automated test. |
| B: SSE before POST | Own echo staged; receipt maps server ID to local key and yields one row. Known history/other senders stay visible. Automated test. |
| C: delayed SSE | POST receipt suffices to show Saved with plaintext. Automated test; normal runtime also shows immediate plaintext continuity. |
| D: reconnect/duplicate echo | Exact server-ID merge yields one authoritative row; no second confirmation announcement. Automated test. Transport/cursor implementation itself is unchanged. |
| E: write succeeded but receipt lost | Unknown intent remains. A later server row is independently authoritative and cannot safely be linked. **Two representations may coexist**, with the local one explicitly unconfirmed. The strongest single-row requirement is not achieved for this case. Automated test demonstrates the limitation rather than silently collapsing by text/time. |
| F: genuine rejection | Failed row retained; newer text/reply untouched. Automated test with route-contract rejection statuses. |
| G: rapid consecutive sends | Separate operation identities, out-of-order receipts safe; identical legitimate text allowed. Automated test plus authenticated runtime with two pending sends and a newer unsent draft. |
| H: switch away/back unresolved | Dashboard memory retains operation/key/reply; completion affects the original scope. Automated delayed-completion test. Runtime navigation requested with one visibly pending row, then return showed one confirmed row and no replayed announcement. Actual unmount-versus-HTTP timing was not instrumented. |

## Draft safety and retry decision

Failed/unknown rows keep their text and reply independently of draft text. No completion path calls `setDraft` or restores an older reply target. The user can continue drafting B while A settles. Existing native text selection/copy remains available; no automatic restoration, Edit/resubmit action or Retry button was introduced. Reply intent is retained as a visible preview and in the operation snapshot.

Drafts retain the existing 80-conversation LRU policy. Unresolved operation intent is separate from that LRU and is not evicted when another draft is edited. All this memory ends on reload, logout or account replacement; it is not an offline outbox. Confirmed mappings/operation snapshots are retained for this dashboard lifetime for continuity. No message plaintext, feedback data or correlation map is written to localStorage, IndexedDB or another disk store by this change. Existing encryption-device storage is unchanged.

Pre-POST failure could eventually support a carefully scoped retry, but this patch introduces no retry path. Unknown outcomes require a separately reviewed correlation/idempotency contract before reliable reconciliation/resubmission can be promised. No backend field, ciphertext comparison, automatic resend, content/timestamp heuristic or fabricated Undo has been added.

## Accessibility, mobile and performance

Each local row has a persistent textual state description. A single polite, atomic `role=status` region announces operation transitions; row text is not another live region. The send owner increments its announcement sequence only for intent/terminal transitions. SSE echoes, repeated completion, regular renders and channel remount do not replay successful announcements. A remount starts its announcement checkpoint at the current sequence. Native form/button/textarea behavior is preserved. These statuses work without animation, sound or haptics; no new reduced-motion exception or looping decoration exists.

The status uses an ordinary `div` with existing utility styles (11 px / 16 px line, inherited text color at .7 opacity). Runtime revealed that legacy mobile `message-bubble > p` rules made the first paragraph version 16 px and message-like; using a dedicated status div avoids that cascade without changing global CSS or message typography. The status footer is 16 px in the final measured channel; longer text may wrap when zoomed or in narrower compositions.

**AUTHENTICATED RUNTIME**, local Next dev app, existing Test account, demo Space with exactly one member (Test/you):

| Check | Observed result |
| --- | --- |
| 1440 × 900, keyboard Enter | One immediate Sending row, then the same AX container acquired the server ID and Saved description. Row count 3 → 4, no second echo row. Focus remained in the composer. Composer stayed at x=439.59375/y=783.96875, 802.8125 × 100.4375 px; send target stayed 54 × 54 px. |
| Rapid sends + draft | Two pending rows appeared; a newer 60-character unsent draft remained after both confirmed and a Messages → channel return. No text from the submitted rows was restored into it. |
| 390 × 844, final styling | Pending → confirmed retained row x=24/y=574.671875, 332 × 106.90625 px. Status stayed 16 px high. Feed scrollTop=575, scrollHeight=1123 and clientHeight=548 stayed identical through acknowledgement. Composer remained x=12/y=699, 366 × 65 px; send target remained 48 × 48 px at x=322/y=708. No sampled row or document horizontal overflow. |
| Navigation | Requested Messages navigation with one pending row, returned by browser Back: nine total rows (three original + six QA sends), two current-owner local rows confirmed once, draft empty and live region empty on remount. |
| Console | No captured errors. One Next development Fast Refresh full-reload warning occurred while source was being edited; this reset earlier in-memory mappings as expected for reload. It was not a send/route failure. |

The mobile authority is **viewport emulation with browser-native fine-pointer input**, not touch injection or a physical phone. No mobile keyboard was opened. Screenshot: [final mobile confirmed state](../.codex-temp/phase2a-mobile-confirmed.jpg). Six clearly labeled QA messages remain only in the local self-only demo channel. Temporary test draft text was cleared and the viewport override reset; no local database cleanup/migration was performed.

Unchanged row references and stable React keys are behavior-tested. Confirmation does not modify encrypted state or trigger decryption itself; SSE still uses the existing cache. There is no added entrance animation or composer busy lock. These facts plus sampled geometry/scroll stability do **not** establish React profiler counts, latency percentiles, missed-frame rates, physical touch response or a perceptual calibration result.

## Test evidence and limits

**AUTOMATED TEST / EMULATED NETWORK:** deferred encryption/POST dependencies exercise the production send owner and presentation code, including slow work, pre-write rejection, response loss after simulated storage, malformed receipts, out-of-order rapid sends, stale completion, scope changes and owner unmount. A test invokes the actual JSX form handler twice from one render and then submits a newer draft; exactly two intended POSTs occur and subsequent typing stays intact. Actual row JSX is executed to verify stable keys, state descriptions and absent server actions before confirmation. These are behavior tests, not authenticated browser network interception.

Final commands/results (all exit 0):

| Command | Result |
| --- | --- |
| `npm run lint` | No errors or warnings. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Pass. |
| `npm run test:chat` | 25 pass: 6 existing + 19 new send tests. |
| `npm run test:interaction` | 10 pass. |
| `npm run test:mobile`, `npm run test:media`, `npm run test:music`, `npm run test:audit` | 20 / 20 / 9 / 6 pass respectively. |
| Final combined `node --test` over those seven test files | **90 pass, 0 fail/cancel/skip** after the final source change. |
| `npm run build` | Prisma client generation, Next compile, TypeScript and 47 static pages completed; no migration. |

An initial new test failed because its mock UUID generator reused an ID before either POST began. Giving the fixture independent operation IDs fixed the test; this was a test-harness defect, not evidence of a product failure. No final regression or pre-existing check failure was found.

**ENVIRONMENT LIMITATION:** this connected browser exposes viewport control and page assets, but no documented request interception/throttling/offline capability. Artificially slow, rejected and interrupted requests were exercised by automated dependencies, not in the authenticated browser. No server/business behavior was changed to manufacture faults. Authenticated failed/unknown mobile layouts, physical touch/on-screen keyboard, live Phase 2A reduced-motion changes, assistive-technology speech, account-switch UI, multi-client delivery, production-mode hydration and frame traces remain unverified. The runtime account had no direct-message peer; DM coverage is the shared owner's source/tests rather than a sent conversation with another person.

## Files and rollback boundary

- `lib/message-send.ts`: client-only operation memory, POST outcome authority and exact-ID presentation.
- `components/chat/message-drafts-provider.tsx`: adjacent send/reply store and account-owner lifetime guard; existing draft API preserved.
- `components/chat/realtime-message-panel.tsx`: text submit integration and one live region; existing encryption/SSE/poll flow preserved.
- `components/chat/message-list.tsx`: stable visual key, subtle status and guard against server actions on unestablished IDs.
- `app/dashboard/layout.tsx`: account key on the existing memory provider; no route/API/authentication logic change.
- `tests/message-send.test.mjs` and `package.json`: focused send tests included in `test:chat`; Phase 1's test script retained.
- This document and an append to `doshab-interaction-calibration.md`; optional local screenshot above. Other pre-existing changes remain untouched.

Rollback is this text-send owner/presentation integration plus its test script addition. Keep Phase 1 tokens/consumer/CSS/tests and unrelated work intact; do not revert the complete working tree. There is no schema/transport migration to reverse. Reload clears these memory-only operations.

## Acceptance-only review — 2026-10-08

No application, test, schema, API, encryption or transport code changed during this review. The evidence above records implementation verification; the following adds the current acceptance findings without relabeling dependency-controlled tests as browser faults.

### Correlation boundary and product decision

Re-read `lib/message-send.ts`, the provider and panel integration, the message POST/SSE route, `lib/chat-messages.ts`, `lib/message-bus.ts`, the encryption envelope and Prisma `Message` model. There is **no trustworthy identifier spanning local intent → request → database → SSE without the HTTP receipt**:

- The local operation UUID stays in dashboard memory; the existing POST body does not transmit it.
- Prisma generates the server message ID. A valid POST receipt supplies the only explicit local-operation-to-server-ID mapping.
- The bus, SSE and database catch-up return server message identities. They do not carry the local operation UUID or another intent identifier.
- Encryption IVs, ephemeral keys and payload bytes are cryptographic material, not a logical operation correlation contract. No text, timestamp, ciphertext, sender-plus-text or ordering inference was used.

**CORRELATION DECISION: ACCEPTED LIMITATION FOR 2A (A).** If a write succeeds and its receipt is lost, the local row says `Unconfirmed · Don't resend`, keeps its text/reply and offers no server actions or Retry. Independently established server history can show another row with the same-looking text and normal server actions. That is two representations of potentially one stored message, not evidence of two database writes. The user may need to distinguish the retained intent from stored history; the application cannot resolve that distinction truthfully with its current protocol.

This is an acceptable v1 tradeoff because the unresolved row explicitly warns against resending, storage is never falsely confirmed or rejected, recoverable intent remains visible, and authoritative history is not hidden indefinitely. The feature adds no retry or automatic resend that could turn uncertainty into an additional write. Normal receipt-known sends reconcile by exact ID. A durable correlation design is a prerequisite for any later promise of exact lost-receipt reconciliation or safe ambiguous-outcome retry, and must be reviewed separately.

This product decision uses the implemented labels, action restrictions and tested presentation contract. **The lost-receipt coexistence screen has not yet been observed under an authenticated browser fault in this closeout.** Accepting the architectural limitation does not close the remaining fault-mode runtime acceptance.

### Additional authenticated evidence

The existing local Test account and self-only demo `#general` channel were reused. Browser viewport measured **390 × 844 CSS px**. Input was browser-native Enter/fine-pointer automation, **not touch emulation**. Three additional clearly labeled local QA messages were sent, A/B/C; each had one intended form submission.

| Acceptance item | Current evidence / result |
| --- | --- |
| Authenticated artificial slow send | **UNVERIFIED.** No artificial latency was established by the agent. Browser tooling has no documented throttling/interception/offline capability. A manual DevTools slow-network handoff was requested and remains pending. Natural pending states below are not a substitute. |
| Authenticated known failure | **UNVERIFIED.** No controlled pre-write or HTTP rejection was produced in this closeout. Route rejection and pre-POST failure classifications remain covered by the prior automated tests. |
| Authenticated unknown outcome | **UNVERIFIED.** No post-invocation connectivity interruption was performed. Text/reply retention and unknown classification remain automated evidence only. |
| Network recovery / lost-receipt UX | **UNVERIFIED at runtime.** No fault was introduced, so no recovery or uncertain-local-plus-stored-row screen is claimed. The exact contract and accepted limitation are described above. |
| Rapid send | **PASS for the observed channel flow.** A appeared as Sending, then Saved in the same AX container; B and C were concurrently visible as Sending before confirmation. Three operation rows subsequently showed Saved, with twelve total rows: three original + six prior QA + three new QA. No extra echo row appeared in the sampled result. Stable React key behavior remains supported by source/tests; no DOM mutation observer or profiler was installed. |
| Draft safety | **PASS for rapid success and route return.** The newer unsent draft `Phase 2A acceptance newer draft — keep unsent.` remained unchanged after all three confirmations and route return. The composer and Send stayed enabled while that draft existed. Failed/unknown draft safety is not authenticated runtime evidence yet. |
| Route/channel continuity | **PARTIAL.** Messages route contained zero send-state rows and no `Message #general` composer. Back returned to the original channel with exactly the same three confirmed server IDs, twelve total rows and the intact newer draft. The operation live region was empty on remount. This additional cycle used confirmed operations; unresolved navigation, another text channel and account switching remain unverified in this closeout. The earlier pending-navigation sample and scoped owner tests remain recorded above. |
| Accessibility | **PARTIAL.** AX exposed Sending and the distinct server-storage-only Saved description. Native Enter created one intent per submission and retained composer focus. The single atomic status region showed `Message saved on server.` after completion, stayed unchanged on a later sample and was empty after route remount; no extra confirmation was observed. This is sampled DOM/AX evidence, not screen-reader speech or a complete mutation trace. Failed/unknown AX states and live reduced-mode fault checks remain unverified. Current reduced-motion query was false; the status itself had animation `none` and transition `0s`, and source/tests establish persistent text independent of motion. |
| Mobile | **PARTIAL overall; normal send PASS.** Actual 390 × 844 layout: row width 332 px; A height 130.90625 px, grouped B/C heights 82.90625 px, with wrapped message text and 16 px status footers. Settled feed scrollTop 904, scrollHeight 1452, clientHeight 548: at the latest row. After route return the composer was 366 × 65 px at x=12/y=699 and Send 48 × 48 px at x=322/y=708. No document horizontal overflow. Filled-input automation initially scrolled the page root while focusing the composer; after route return root scrollTop was 0, root scrollHeight 844 and the normal composition was restored. This is not evidence of a confirmation-driven layout jump. Fault-state wrapping/scroll stability, physical touch and on-screen keyboard remain unverified. |
| Console | No captured warning/error entries in this additional runtime review. |

Contextual evidence: [mobile rapid sends after route return](../.codex-temp/phase2a-acceptance-rapid-return.jpg). The earlier focused-input capture is [mobile rapid sends before route return](../.codex-temp/phase2a-acceptance-rapid.jpg); it records the scrolled focus state, not the resting composition.

### QA data, checks and remaining action

**QA cleanup:** no existing supported per-message deletion or dedicated local-test cleanup path was found in the UI/API or repository scripts. Backup/isolated restore-smoke-test scripts are not message cleanup. No ad hoc deletion code, SQL, Prisma mutation, migration or non-test data change was used. The original six and three new QA messages remain in the local self-only demo channel. The temporary unsent draft is cleared at handoff; durable message data is left intact.

**Files changed for this review:** this report and `doshab-interaction-calibration.md`, plus the two local evidence screenshots linked above. Existing implementation and unrelated working-tree changes are preserved. No tests, lint, TypeScript or production build were rerun: no code changed. The last implementation results remain 90 passing tests, lint/typecheck/build exit 0; those are prior verification, not new runs. Explicit documentation whitespace/local-link validation and scoped `git diff --check` passed (exit 0). Temporary draft cleared and viewport override reset before handoff.

**Required next action:** follow the staged manual network-control handoff below, one confirmed setting change at a time. No permission to alter product/server behavior or start another phase is inferred from this tooling limit.

### Manual fault acceptance — staged handoff

The next user instruction keeps the correlation decision accepted and authorizes one-at-a-time manual DevTools changes. A known pre-write rejection that cannot be safely reproduced with existing browser/application conditions may be classified **AUTOMATED AUTHORITY / RUNTIME NOT REPRODUCED**; it will not by itself keep acceptance open. No destructive setup or manufactured server error is authorized.

**Test 1 preparation complete; awaiting the user's `slow` confirmation.** Reused the authenticated local Test account, self-only demo `#general`. Temporary draft is empty; all three memory-owned operation rows are confirmed, with **zero pending/unknown operations**. Normal server connectivity was checked through the existing Pinned messages control: a fresh authenticated fetch completed and rendered the existing pinned message, with no error. The dialog was closed and the feed scrolled to its latest row. No new QA message has been created for this stage.

| Before-throttling baseline | Measured value |
| --- | --- |
| Viewport | 1440 × 900 CSS px, browser fine-pointer input |
| Rows | 12: three original + nine existing QA |
| Latest row | x=461.59375/y=695.015625, 748.8125 × 64.71875 px |
| Composer | x=439.59375/y=783.96875, 802.8125 × 100.4375 px |
| Composer form | x=461.59375/y=797.96875, 758.8125 × 54 px |
| Send target | x=1166.40625/y=797.96875, 54 × 54 px |
| Feed | scrollTop 663, clientHeight 516, scrollHeight 1179: at bottom |
| Draft / operation live region / offline notice | Empty / empty / absent |
| Horizontal overflow | None |

[Prepared slow-send baseline](../.codex-temp/phase2a-manual-slow-baseline.jpg). The current handoff asks for DevTools Network → Slow 3G or the slowest existing built-in throttled profile, device emulation off, and no send/reload yet. Testing will not begin until `slow` is received. Network restoration will require its own confirmation before the next stage. No application code changed or application checks reran during preparation.

### Test 1 resumed after the appearance-settings change — 2026-10-08

The user replied **`slow`**. This confirms the requested manual slow-network setup; the preset itself is **USER-REPORTED**, since browser tooling cannot inspect DevTools settings. The tab was on Home, so the existing demo Space link returned to the authenticated self-only `#general`. A fresh Pinned messages read succeeded and its dialog was closed. No send was invoked by the agent.

Current pre-send baseline is **1868 × 918 CSS px**, twelve stored rows, empty draft and zero pending/failed/unknown operation rows. The earlier 1440 × 900 capture is a separate baseline, not the current viewport. Feed is at bottom (620 + 546 = 1166). Latest row is 1176.8125 × 64.71875 px at x=461.59375/y=713.015625; composer frame is 1230.8125 × 100.4375 px at x=439.59375/y=801.96875; Send is 54 × 54 px at x=1594.40625/y=815.96875. No document horizontal overflow; atomic operation status is empty; captured console warning/error list is empty.

Prepared only the unsent text `Phase 2A slow send — local QA.`. The user was asked to press Send once, immediately type `Phase 2A slow newer draft — keep unsent.` without submitting it, and reply `sent`. **Awaiting that manual action; no slow-send result or new stored QA message is claimed yet.** An observation wait ended without a pending row; the next inspection still showed the prepared unsent text and twelve rows. That is an observation-window limit, not a send failure. [Prepared handoff](../.codex-temp/phase2a-slow-prepared.jpg).

Filling/focusing the prepared composer scrolled the existing outer `.dashboard-shell-main` to 313 px, without sending. Opening/closing the existing Pinned control restored that outer scrollTop to 0 and the original composer-frame position; the draft stayed intact. Final prepared feed scrollTop is 592 (28 px from bottom), rather than the initial 620. This focus-related scroll adjustment preceded the send and must not be attributed to confirmation. The handoff screenshot shows the restored composition.

Only acceptance documentation/evidence changed in this resumed stage. No application checks were rerun because no code changed. The separate appearance-settings change previously passed lint, explicit TypeScript, production build and 95 combined tests; those are prior checks, not new Phase 2A fault evidence. Slow-network restoration still needs its own user confirmation after inspecting the send.

### Test 1: first manual slow-send result — 2026-10-08

The user replied `sent`. The first inspection found `Phase 2A slow send — local QA.` already **confirmed**, with server ID `cmuzrbped000i4c7i2e75fy1z`. It shows `Saved` and the accessible description `Saved on server. This is not a delivery or read receipt.` The user subsequently reported **`I didn't catch the pending state`**. Neither the agent nor the user observed this send's pending interval, so immediate Sending, pre-receipt row presence, typing while pending and pending-to-confirmed row continuity remain **UNVERIFIED for this artificially slowed send**. Prior automated/normal-runtime evidence is not relabeled as that missing observation.

| Observed after manual send | Result / evidence |
| --- | --- |
| Stored confirmation | One matching confirmed row; valid-receipt authority is the existing production owner contract. No DevTools request timing was captured. |
| Draft safety / composer | Exact newer unsent draft `Phase 2A slow newer draft — keep unsent.` remains; composer and Send are enabled. The agent did not submit that draft. |
| Duplicate echo / announcement | Thirteen total rows, exactly one target row at first and later samples; the same server ID and `Message saved on server.` status remain. No extra echo/second confirmation observed in those samples; not a full mutation or screen-reader trace. |
| Geometry / scroll | Viewport now 1868 × 944, 26 px taller than preparation. Target row 1176.8125 × 84.625 px at x=461.59375/y=723.734375; composer frame 1230.8125 × 100.4375 px at x=439.59375/y=827.96875; Send 54 × 54 px. Feed 674 + 572 = 1246 of 1251: 5 px from bottom. Outer main scrollTop 0; no document horizontal overflow. The viewport change prevents attributing positional differences to send confirmation. |
| Console | Captured warning/error list empty in the follow-up sample. |
| QA data | One additional clearly labeled self-only local QA message: ten QA + three original = thirteen stored rows. No cleanup mutation or extra resend. |

[Observed confirmed row and retained draft](../.codex-temp/phase2a-slow-observed.jpg). **SLOW SEND: PARTIAL**, pending interval not captured. Requested DevTools Network → **No throttling / Online**, leave the channel and newer draft open, reply `normal`. **Awaiting restoration confirmation; no subsequent runtime test has begun.** A separate pending observation is still needed before completing Test 1.

Ahead of the next stage, source-only review checked the existing POST validation/auth/membership/rate-limit paths: 400 malformed/invalid encrypted envelope or non-text channel, 401 unauthenticated, 404 inaccessible channel and 429 after the existing 60-per-minute limit all precede message creation. Normal text UI prevents invalid/empty/overlong content and constructs its encrypted envelope; logout/membership edits would alter the ownership/data boundary, and exhausting the limit would create excessive QA writes. No safe normal-UI authenticated rejection candidate was found under the requested constraints. This review creates no failure and does not yet advance the manual sequence; the permitted automated-authority classification will be recorded when Test 2 is reached after restoration.

Only the two acceptance documents and the local evidence capture changed. Scoped `git diff --check` passed; no application checks rerun because no code changed. No token tuning, protocol/schema/transport changes or later-phase work.

### Test 1 restoration and pending-capture preparation — 2026-10-08

The user replied **`normal`**, confirming the requested No throttling / Online restoration. A fresh existing Pinned messages read succeeded and the dialog was closed. The first slow QA message still has one confirmed row with the same server ID; thirteen stored rows, no pending/failed/unknown operations. The newer temporary draft was still intact at inspection, then deliberately replaced with the next clearly labeled QA draft for the missing pending observation.

Prepared **`Phase 2A slow pending capture — local QA.` without submitting it**. Current viewport is 1868 × 918; composer frame remains 1230.8125 × 100.4375 px at x=439.59375/y=801.96875, Send 54 × 54 px at x=1594.40625/y=815.96875. Outer scrollTop 0; native feed scrolling then left the latest row visible at 704 + 546 = 1250 of 1251 (1 px from bottom); no document horizontal overflow. [Prepared capture attempt](../.codex-temp/phase2a-slow-retry-prepared.jpg).

Requested Slow 3G or the slowest existing built-in preset, DevTools kept open, device emulation off, and **`ready` plus the preset name before sending**. This adds a readiness handoff so observation can begin before the manual Send. **Awaiting profile/readiness confirmation; no second QA write or pending observation yet.** Test 1 remains PARTIAL. No new runtime fault, product code, token or application-check run. Scoped documentation whitespace check passed; no later phase started.

**PHASE 2A ACCEPTANCE: PARTIAL. SAFE TO BEGIN PHASE 2B: NO.** Correlation is an accepted limitation, not the current blocker. Authenticated fault/recovery acceptance remains open. Phase 2B/2C/2D were not begun.

### Acceptance resumed after sidebar rollback — 2026-10-08

The user requested continuation of the phases. The authenticated self-only demo `#general` is still open with the restored pre-redesign sidebar. Fresh DOM/AX inspection found thirteen stored rows, an empty editable composer, no operation-state rows, an empty atomic status region, and no horizontal document overflow. The previous prepared pending-capture draft is no longer present; no new message was sent during this resumption.

Current viewport is 1868 × 918 CSS px. Feed scroll is 692 + 546 = 1238 of 1238 (at bottom), outer main scrollTop is 0. The composer form is 1186.8125 × 54 px and Send is 54 × 54 px; Send is disabled because the draft is empty. Form measurements are distinct from the surrounding composer-frame measurements in earlier entries. [Resumed baseline](../.codex-temp/phase2a-resumed-baseline.jpg).

The last user-confirmed normal-network setting preceded the sidebar work. Current DevTools settings cannot be inspected by these browser tools. Requested **No throttling / Online** again as a manual setup step, retaining this channel. **Awaiting `normal`; no fault test or repeat QA send has begun.** Next, obtain slow-profile readiness before arranging observation and the single manual pending-capture send. Test 1 and Phase 2A remain PARTIAL; Phase 2B has not begun. This resumption changes acceptance documentation/evidence only; application checks are not rerun for a documentation-only handoff.

### Normal-network confirmation and pending-capture readiness — 2026-10-08

The user replied **`normal`**, confirming No throttling / Online. A fresh Pinned read displayed the existing pinned message; the panel was closed. Prepared only `Phase 2A slow pending capture — local QA.` in the previously empty composer, without submitting. Thirteen stored rows, no operation-state rows, empty atomic status, and captured console warnings/errors empty. At 1868 × 918 the feed remains at bottom (692 + 546 = 1238), outer scrollTop 0, no horizontal overflow, composer form 1186.8125 × 54 px and Send 54 × 54 px. [Normal-network prepared draft](../.codex-temp/phase2a-normal-ready.jpg).

Requested **Slow 3G or the slowest built-in throttling preset**, device emulation off, and **`ready` with the preset name without sending yet**. Awaiting that setup confirmation before the manual send observation window. No additional stored QA message, fault outcome, runtime-code change or later-phase work is claimed. Phase 2A remains PARTIAL. Only acceptance documents/evidence changed; no application checks rerun.

### Pending-capture attempt after slow-profile setup — 2026-10-08

The user replied **`i did`** to the requested slow-profile setup. This is user-reported setup confirmation; the preset name was not supplied and DevTools settings remain unavailable to the tools. Before sending, the current viewport was 1319 × 918 CSS px (DevTools-sized), thirteen rows, the exact prepared unsent QA draft, no operation-state rows, and empty atomic status. Composer form 819.8125 × 54 px, Send 54 × 54 px; outer scrollTop 0, no document horizontal overflow. Feed 689 + 546 = 1235 of 1238 (3 px from bottom). [Current pre-send baseline](../.codex-temp/phase2a-slow-armed-baseline.jpg).

Requested one manual send of `Phase 2A slow pending capture — local QA.`, immediately followed by the newer unsent draft `Phase 2A newer draft — keep unsent.`. A bounded 45-second pending-selector observation expired with the original draft still unsent and thirteen rows. A subsequent 50-second observation did not capture a visible pending row; its completion sample showed the new target already confirmed. The user replied **`sent`**. These waits provide no pending or request-timing evidence and do not demonstrate that pending was absent from the app.

The target has one confirmed row, server ID `cmuzv0vmr000k4c7i4sulpypl`, with `Saved` and `Saved on server. This is not a delivery or read receipt.` Fourteen total stored rows (three original + eleven QA); one target at completion and follow-up samples, unchanged `Message saved on server.` atomic status, captured warning/error list empty. Current viewport remains 1319 × 918; target row 809.8125 × 84.625 px at x=461.59375/y=693.359375; composer and Send boxes remain at their pre-send positions. Feed is at bottom (776 + 546 = 1322), outer scrollTop 0, no horizontal overflow. [Confirmed result](../.codex-temp/phase2a-second-slow-confirmed.jpg).

The composer is empty in both post-send samples, editable, and Send is disabled for the empty draft. **It is not yet established whether the user entered the requested newer draft.** Asked whether Sending was seen and whether the newer draft was not entered, disappeared, or was cleared manually. Awaiting those answers before classifying this attempt's pending/draft evidence. Do not infer draft loss from an empty composer alone. Normal-network restoration will be requested separately before the next fault stage. No repeat send, cleanup mutation, application-code change, token tuning or later phase. Application checks not rerun for acceptance documentation/evidence only. **Phase 2A remains PARTIAL; safe to begin Phase 2B NO.**

The user subsequently confirmed **`I only sent; I did not type the newer draft`**. The empty composer is therefore expected, not evidence of lost newer typing. This attempt does not exercise typing while pending or preservation of a newer draft. The separate question about seeing Sending before Saved remains unanswered; no new send or next fault stage has begun.

The user answered the remaining question **`No, I only saw Saved`**. Neither observer captured Sending for this attempt; pending visibility and pending-to-confirmed continuity remain unverified, rather than passed or proven absent. **Slow-send acceptance remains PARTIAL.** No minimum display time or input/network delay was introduced. Requested **No throttling / Online** restoration and `normal`, retaining `#general`, before the lost-response stage. Awaiting restoration; no additional QA send or fault test has begun.

### Network restored; known-failure classification and lost-receipt preparation — 2026-10-08

The user confirmed **`normal`**. A fresh Pinned read returned the existing pinned message, then its panel was closed. Test 1's missing pending/typing evidence remains PARTIAL; restoring connectivity does not resolve that gap.

**TEST 2 — KNOWN FAILURE: AUTOMATED AUTHORITY / RUNTIME NOT REPRODUCED.** Existing production pre-write paths and maintained tests were reviewed. Malformed/invalid envelopes are prevented by the normal text UI, authentication/membership manipulation would alter the agreed account boundary, and rate-limit exhaustion would require excessive writes. No safe legitimate normal-UI authenticated rejection was identified. No server/business change, account revocation, manufactured 500 or rate-limit flood was performed. Prior passing automated evidence remains the authority for retained failed intent, truthful Not sent, newer-draft independence and no POST/retry where inappropriate. Under the user's explicit exception, this runtime limitation alone does not keep Phase 2A open.

Prepared **`Phase 2A lost receipt — local QA.`**, replying to the prior QA message `cmuzv0vmr000k4c7i4sulpypl`, through the existing Reply action. It remains **unsent**, with reply context visible. Fourteen stored rows, no new operation. At 1319 × 918: composer form 819.8125 × 54 px, Send 54 × 54 px, no horizontal overflow; feed 827 + 485 = 1312 of 1322 (10 px from bottom). Reply/focusing briefly scrolled the existing outer main to 263 px; opening/closing Pinned restored outer scrollTop 0 while retaining draft and reply. This happened before send and is not a fault outcome. [Prepared lost-receipt draft](../.codex-temp/phase2a-lost-receipt-prepared.jpg).

Requested the **slowest online throttling preset and its exact displayed name**, Offline off and device emulation off; **no send yet**. Awaiting this setup before the manual send/POST-visible/disconnect sequence. A disconnect before message POST would instead exercise pre-write encryption/device lookup failure and must not be mislabeled lost receipt. No request timing, ambiguous outcome or recovery is claimed yet. Documentation/evidence only; no application-code change or application checks rerun. **Phase 2A PARTIAL; safe to begin Phase 2B NO.**

### Publication requested before further phase work — 2026-10-09

The user explicitly requested production publication before continuing, then added use of an existing user profile photo in the Home welcome artwork and Profile / Settings icon. This overrides the earlier no-publication scope for the current release; it does not mark Phase 2A accepted. The sidebar already uses the existing profile image and safe person fallback. Home now requests that same image field and uses it in the existing artwork bounds, with lunar artwork underneath as the unavailable-image fallback.

Manual fault acceptance is paused at the prepared **unsent** lost-receipt draft/reply. The response to the network-preset question was QA message text, so no exact preset or disconnect is established. Fourteen stored local rows, no unresolved operation at the last pre-publication inspection. No QA message was sent to production. Slow pending/typing, lost receipt, recovery and unresolved route/reduced/mobile fault evidence remain open. **Phase 2A PARTIAL; safe to begin Phase 2B NO.** Publication proceeds on the user's explicit instruction, with these limits retained.
