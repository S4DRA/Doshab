# Listen Together

YouTube-only music inside VAL group voice rooms. The music button sits before the existing microphone control in both the room and call dock. Search, player, and mini-player use the existing dark surfaces and red signal color. The official video is inside Listen Together; there is no separate top-right dock. Minimizing keeps that same iframe visible. Closing unloads the iframe and stops local playback; reopening joins the current room position. Microphone, camera, screen sharing, and voice preferences keep their existing implementations.

## Setup

Both player sizes can be moved using the title grip with mouse/touch or arrow keys (Shift moves faster). Position is retained across minimize/expand while open and clamped on viewport or content resizing. Dragging updates DOM position without rerendering playback. The compact player provides DJ restart/play/pause/next, queue/search access, and local volume/mute. Browser interaction verification remains blocked by the browser tool policy check.

- Existing `DATABASE_URL`, authentication configuration, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are required.
- `YOUTUBE_API_KEY`: required server-only key from a Google Cloud project with YouTube Data API v3 enabled. Sent through `X-Goog-Api-Key`, never included in browser payloads or playback URLs. The local key is stored in ignored `.env.local`; deployed environments need their own environment configuration.
- Optional `YOUTUBE_REGION_CODE`: two-letter country code for music chart and availability filtering. Individual participants can still encounter different regional restrictions.
- Configure LiveKit to send signed webhooks to **your deployed VAL origin + `/api/livekit/webhook`**, signed with the same configured LiveKit API key. `participant_left` and `participant_joined` reconcile music membership. This is needed for immediate cleanup after the last participant leaves. Localhost is not reachable by a hosted LiveKit webhook. Without a reachable webhook, remaining clients reconcile DJ changes; empty-room state disappears when LiveKit expires the room.
- No migrations, new tables, or new dependencies.

## State and synchronization

`valMusicV1` in LiveKit room metadata stores the track, queue, DJ, state, base position, server start time, version, recent 10 tracks, and recent command IDs. Existing unrelated JSON metadata is preserved. Room SID distinguishes successive lifetimes of a channel.

Only authenticated active participants who still belong to the space can read or mutate music. The first person to **Play now** becomes DJ. Other participants may search and enqueue. DJ-only controls include pause/play, seek, skip, immediate play, queue edits, and autoplay. Reassignment chooses the earliest remaining active member, then identity as a stable tie-breaker. A returning former DJ does not displace the current DJ.

Clients consume validated, versioned server-owned LiveKit room metadata directly. Initial connection, reconnection, participant departure, visibility restoration, and opening the player fetch authoritative snapshots. A sixty-second recovery check fetches only while a track exists or initial synchronization has failed; idle rooms do not poll the endpoint. Bursts coalesce into one active request and one follow-up, without a spinning timer. Participant data packets are never trusted. Their clocks align using server receive/send timestamps; backend processing time is excluded from the round-trip estimate. Playback progresses locally. A three-second check seeks above 500 ms when the official player is playing the expected video duration. Buffering and unstarted states are left to YouTube. There is no artificial playback-rate correction. This is social listening sync, not sample-accurate audio; ads, keyframe seeking, buffering, and regional restrictions can interrupt it.

The official YouTube IFrame API code and iframe load only when an open music popup has a track. The iframe stays mounted across minimize/expand and is destroyed on close. The player viewport is at least 200 x 200 pixels; native controls, links, and ads remain available. It pauses when the document becomes hidden, the player is out of view, or room state reconnects. **Rejoin synchronized music** restores local playback at the shared position. Native player pause/seek overrides are local until a shared playback command or explicit rejoin. A music-only boundary isolates rendering failures. Browser autoplay blocking offers **Click to join the music**. Volume defaults to 35%; volume and mute are stored locally under `val:music-volume:v1`, separately from voice preferences.

## Concurrency and durability

Provider lookups happen before acquiring the room lock. A PostgreSQL transaction-scoped advisory lock serializes the final LiveKit snapshot/version check and metadata update across application instances. No database rows or playback positions are written. The critical section requires LiveKit round trips (three-second individual timeouts); transaction timeout is ten seconds. Conflicts return 409 and refresh the client. Enqueues can merge against newer versions; playback and reorder commands reject stale versions. Recent command IDs prevent duplicate application of a repeated request.

The queue is capped at 30 tracks and scrolls in a bounded viewport. Next-track selection checks at most five queued candidates in one batched YouTube request. Same-channel and chart recommendations load concurrently. Unavailable candidates are skipped, and transport failures pause with an actionable error. Autoplay is off by default; it selects music from the same channel and popular music, excluding current/recent tracks. Clients can report an ended track, but the server verifies elapsed time before advancing. If all tabs sleep, the next snapshot reconciles an elapsed track; there is no always-running music worker.

Room music is ephemeral. A browser reload can recover an ongoing LiveKit room's session after rejoining. LiveKit room deletion/recreation ends the old music session. There is no durable playlist or history.

## Provider

`MusicProvider` separates search, browse, track lookup, related selection, and playback source construction. YouTube is the only provider. Search uses the official Data API, category 10 (Music), and embeddable/syndicated video filters, followed by authoritative duration/status lookup. Non-music, private, live, age-restricted, and known region-blocked videos are excluded. Exact titles and uncropped thumbnails identify YouTube results. Pasted `music.youtube.com/watch?v=...`, regular YouTube links, and `youtu.be` links resolve to their music video IDs.

This uses YouTube music videos, not a private YouTube Music API or Premium audio-only experience. No scraping, ripping, audio extraction, media proxying, account linking, or personal YouTube Music library access is used. The visible official video player is required during playback. Closing the controls cannot turn it into hidden background audio.

Search is debounced, cached, and rate-limited; minimized search cancels pending work. Progress ticks stop when paused, minimized, or the document is hidden. Iframe synchronization ticks stop when hidden/out of view and are cleaned up on close. Volume changes use a separate status snapshot so slider movement does not rerender the popup and queue. YouTube API quotas apply; a missing/disabled/exhausted key produces an explicit error. Recommendations are channel/popular-music based, not personalized YouTube Music recommendations. The provider may still reject an apparently embeddable video at runtime. Retry/next controls surface these failures without stopping voice.

References: [YouTube Data API search](https://developers.google.com/youtube/v3/docs/search/list), [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference), [YouTube policy guide](https://developers.google.com/youtube/terms/developer-policies-guide), [LiveKit room metadata](https://docs.livekit.io/transport/data/state/room-metadata/).

## Verification

Run `node --test scripts/test-music.mjs` for deterministic production-reducer tests. Test-only fixtures do not create accounts, tracks, notifications, or database records.

Verified during implementation:

- `npm run lint`: passed, no warnings/errors.
- `npx tsc --noEmit`: passed; final `npm run build` also passed its TypeScript check.
- `npm run build`: passed, including Prisma generation and all 44 static pages.
- `git diff --check`: passed (Windows line-ending notices only).
- Ten reducer tests: first DJ, mid-song join timing, pause/seek/resume/restart, listener restrictions, deterministic three-participant handoff, empty-room cleanup, reorder validation, queue limits, early-end rejection, and time clamping. Three additional tests cover metadata validation, burst refresh coalescing, and disposal. Four tests cover YouTube URL validation, ISO duration parsing, music metadata, and unavailable/non-music filtering.
- Live YouTube Data API: 10 music search results, single-video lookup, YouTube Music link lookup, nine playable music-chart results, and 19 recommendation candidates. These are metadata tests, not evidence of browser playback.
- LiveKit service connectivity plus metadata creation/update/read in an isolated temporary room (removed afterward), and PostgreSQL advisory-lock exclusion/release.
- HTTP rejection of unauthenticated session/search, malformed commands, and unsigned webhooks.

Browser access was blocked by the browser tool's admin-policy verification. Actual one/two/three-browser playback, listening drift, mobile layout, autoplay prompts, and voice/camera/screen-share regression remain manual checks. Reducer tests are not evidence of those browser scenarios.

Manual acceptance: join with A/B/C; A plays; B joins mid-song; A pauses/seeks/skips; B adds to the queue; C changes local volume; minimize/restore; leave as A and verify DJ transfer; toggle autoplay; reload/reconnect; verify empty-room cleanup with the signed webhook; confirm voice, camera, screen share, and mobile controls throughout.

## Files

- `components/calls/persistent-call-provider.tsx`: persistent music provider and group-room button integration.
- `components/music/music-session-provider.tsx`: session fetching, clock alignment, and error isolation.
- `components/music/youtube-playback.tsx`, `music-volume.ts`, `lib/music/youtube-player.ts`: visible official player lifecycle, synchronization, local preferences, and API loading.
- `components/music/music-button.tsx`, `listen-together-popover.tsx`, `music-search.tsx`, `music-player.tsx`, `music-ui.tsx`, `music.css`: popup states, search, queue, playback controls, artwork, and responsive styles.
- `lib/music/types.ts`, `state.ts`, `metadata.ts`, `refresh.ts`, `server.ts`: shared types, tested state transitions, authorization, concurrency, and metadata service.
- `lib/music/providers/provider.ts`, `youtube.ts`, `youtube-metadata.ts`, `index.ts`: provider abstraction, official YouTube Data API, and tested music-video validation.
- `app/api/music/[channelId]/route.ts`, `app/api/music/[channelId]/search/route.ts`: session, commands, and search.
- `app/api/livekit/webhook/route.ts`: signed membership reconciliation.
- `.env.example`, `scripts/test-music.mjs`, `LISTEN_TOGETHER.md`: configuration, tests, and operational notes.
