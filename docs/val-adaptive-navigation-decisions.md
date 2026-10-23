# VAL Adaptive Navigation decision record

Decision date: 2026-10-23. Base: `9fc3a9b47edde796f4d1866669236f80b9ca5dd6`.

## Scope and boundaries

Improve the existing Next.js App Router application and Electron client. Retain route URLs, browser history, authentication, membership checks, persistent call ownership, encrypted message envelopes, supplied artwork and the approved desktop/mobile compositions. No database schema change or application dependency is required.

Preparation may read an authorized destination. It may never navigate, join a room, start capture, send a message, accept an invitation, update presence or mark notifications read. Account mapping and legacy membership repair on server render are explicitly suppressed for framework prefetch requests.

## Algorithm decisions

| Principle | VAL decision | Cost and tradeoff |
| --- | --- | --- |
| Left-hand/wall following | Borrow consistent placement and predictable backtracking. Keep the existing rails, mobile bar and browser Back/Forward behavior. | No runtime algorithm. Wall following is not a general solution for arbitrary cyclic/disconnected maze boundaries; forcing its geometry onto an application would produce unnecessary loops. |
| Limited lookahead | Prepare one explicitly intended Next destination after sustained hover or focus. Never recursively explore neighbors or infer a social action. | Constant work per intent. A pending intent can be cancelled; one issued destination can temporarily prevent another speculative preparation. User navigation is always available. |
| BFS | Use a small offline screen-transition model in `scripts/analyze-navigation.mjs` to inspect shortest task paths. | O(V + E), outside the product runtime. The model is manually checked against actual routes/controls and excludes typing, scrolling, confirmations and latency. It is not a complete inferred application graph. |
| A* | Reject a runtime planner. VAL already knows the destination selected by the user. There is no defensible learned interaction-cost heuristic or sufficiently expensive search problem. | Avoid a priority queue, guessed weights and hidden rerouting. BFS is sufficient for the small offline model. |
| Trémaux | Borrow bounded memory of prior context and recovery from wrong turns: preserve conversation position, latest known message, drafts and browser history. | At most 80 position records per signed-in dashboard. Store identifiers/offsets in memory, not message bodies. Existing drafts remain memory-only. |
| D* Lite / incremental search | Borrow reuse of valid prior work: Next owns its cache, rows retain stable callbacks, device identity creation and account/device registration coalesce. | No D* Lite planner. Recompute only changed UI data; do not add a second cache of decrypted messages or a graph-search dependency. |

These are engineering applications of principles, not claims that maze algorithms make the UI faster.

## Preparation policy

`AdaptiveLink` retains Next Link semantics, `useLinkStatus` descendants, native modifier-click behavior, focus and browser history. It opts out of automatic viewport prefetch. The previous whole-sidebar and whole-channel prefetch loops are removed.

The small coordinator has one cancellable timer, one unconsumed destination and no unbounded queue. Pointer intent waits 150 ms; keyboard focus waits 80 ms. It permits at most four preparations per minute. These are conservative starting limits, validated against cancelled flyovers, repeated focus, invalidation and real browser hover scenarios; they are not claimed to be globally optimal human-intent estimates.

It stops issuing work while hidden, offline, on reported reduced-data/2G/3G connections, during an active call or in Game-Safe Mode. Unknown network information does not invent device pressure. The resource policy is checked again immediately before dispatch.

Next's installed `router.prefetch` returns no completion promise or cancellation handle. Therefore a timer must not be treated as proof that network work completed. A reservation is released when the destination is visited or Next invalidates it. Already-issued transport work remains Next's responsibility. The counters distinguish issued preparations, repeat intents, visits, suppressions and unused invalidations; they are not a claim to observe Next's internal cache-hit rate or every network request.

The installed Next 16.4.2 type requires `PrefetchKind.AUTO` when passing options, although its bundled public guide omits that requirement. The adapter uses that installed enum in one place. Typecheck/build must accompany future Next upgrades.

## Context and privacy

The signed-in layout keys the experience provider by verified account ID. Position records clear when it unmounts; message bodies are not copied into the new store. When returning to a conversation, restore the visible anchor where it still exists in authorized server data, otherwise retain the saved offset. Existing memory-only drafts and message-send ownership remain in their existing provider. Reopening a previously read position does not mark messages read.

No analytics endpoint, user-content logging, game detection or OS process monitoring is added. Optional local diagnostics retain at most 100 numeric route-commit samples plus aggregate long-task/CLS and preparation counters. A route commit does not prove subsequent decryption, media readiness or field INP. Performance measures use one constant name and replace the previous measure.

Device identity generation is single-flight. A successful registration can be reused for 60 seconds only for the same account and device. Switching accounts, expiry or a failed request requires registration again. The cache retains bounded registration metadata and a void promise, not a second private-key store. Registration has a 10-second network timeout and cannot announce success after HTTP failure. Existing key storage/envelope formats remain unchanged.

## Communication and resource safety

The persistent call provider still owns tracks and remote audio across routes. Game-Safe Mode never changes microphone/camera constraints, codecs, capture permissions, signal transport or call/notification polling. Activity analysis uses one 100 ms sampler normally, a 250 ms sampler without FFT drawing in Game-Safe Mode, and no sampler while hidden. Cleanup closes only its analysis context and never stops session-owned tracks.

Connection diagnostics are user-requested `getStats()` point samples: aggregate audio loss, jitter, round-trip and byte counts, without candidates, IP addresses or device/track identifiers. Missing fields remain unavailable. This is not a continuous network-quality monitor or a bitrate estimator. Existing browser WebRTC congestion control remains responsible for media adaptation.

The approved visual structure remains intact. Comfort settings are opt-in; compact density applies only to larger fine-pointer layouts. OS and manual reduced motion affect chat scrolling as well as CSS. The grouped-message timestamp uses the existing stronger muted-text token to correct a measured contrast failure.

## Windows release policy

The native 0.1.7 startup gate is a companion candidate, separate from the validated web increment. It is not implied to be present in the web-only branch or already deployed.

Keep the existing Electron implementation. It already supplies tray behavior, isolated/sandboxed preload controls, capture consent, persistent login and an updater. The current work provides an actual built Windows installer and live media tests; there is no comparable Tauri/WebView2 measurement supporting a rewrite. Smaller package advertising is insufficient evidence of better call/gaming runtime behavior. A controlled PWA/Electron/WebView2 comparison remains a separate benchmark, not a framework migration decision made here.

Desktop 0.1.7 checks the stable feed before opening the platform. A newer build must download and install first; failures offer Retry/Quit. Evaluate inactivity expiry before any update flush/restart. A running app never forces a restart during a call. Earlier clients must receive this seed once through their existing updater or installer.

Publish installer, blockmap and `latest.yml` together through a draft, then expose the stable release. Preserve existing published assets. Website download clicks bypass stale display metadata and accept only complete, published stable release assets from the existing repository.

## Research references

- [Berkeley CS188: uninformed/informed search overview](https://inst.eecs.berkeley.edu/~cs188/textbook/search/summary.html), [A* and heuristic tradeoffs](https://inst.eecs.berkeley.edu/~cs188/textbook/search/informed.html).
- [Lucas, Récréations mathématiques, chapter on labyrinths and Trémaux](https://www.hist-math.fr/textes/Lucas1882_RecreationsMathematiques1.pdf), printed pp. 41–55. Historical primary text; no maze solver is added to VAL.
- [Koenig and Likhachev, D* Lite, AAAI 2002](https://publications.ri.cmu.edu/d-lite): reuse of previous search work is the relevant principle, not its robotics planner.
- Installed Next 16.4.2 guides: `node_modules/next/dist/docs/01-app/02-guides/prefetching.md`, `optimizing-prefetching.md`, and the installed router type declarations. These were checked against actual types before implementation.
- [Electron performance guidance](https://www.electronjs.org/docs/latest/tutorial/performance): measure the actual application rather than infer resource benefits from the container choice.
- [Web INP guidance](https://web.dev/articles/inp): the good threshold is 200 ms at p75. The stricter research targets remain goals, not results from the limited local samples.
- [Page visibility](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState) and [WebRTC statistics](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats).

The supplied October research controls product direction. Its competitor percentages and gaming aspirations are not VAL measurements and are not used as release performance claims.
