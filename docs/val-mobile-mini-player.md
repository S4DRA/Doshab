# Compact mobile music player

The minimized player stacked its header, song summary, video and transport controls, occupying 397px on the five requested phone widths. A side navbar narrowed the control row and increased its height to 455px.

Only the minimized mobile composition changes. The visible video occupies a 200×200 area, playback/Next/Expand/Close controls sit beside it, and one 48px row holds the song details and queue shortcut. The compact playback button also handles the existing local Join requirement. Provider errors and room notices remain available. Full player controls remain accessible through Expand.

The YouTube iframe stays mounted when switching player sizes. Existing safe-area, keyboard, navbar-position and ongoing-call reservations remain in effect. Below 344px, a side navbar leaves too little horizontal room: controls move into a row below the video instead of overflowing. No desktop styles, music API, database or playback synchronization were changed.

## Measured fit

| Viewport / navigation | Before | After |
| --- | ---: | ---: |
| 360 / 375 / 390 / 412 / 430 × 844, bottom | 397px | 250px |
| 360 × 740, top or floating bottom | 397px | 250px |
| 360 × 740, left or right | 455px | 250px |
| 320 × 640, left | 455px | 302px |
| 390 × 640, bottom | 397px | 250px |
| 844 × 390, existing desktop composition | 374px | 374px |
| 1440 × 1000, desktop | 543.375px | 543.375px |

At the requested widths, the player is 37% shorter and occupies about 30% of an 844px viewport. YouTube requires a minimum 200×200 embedded-player viewport, so this change keeps that video visible. [Provider documentation](https://developers.google.com/youtube/iframe_api_reference).

## Verification

- Thirteen browser cases, including every requested width and each navbar position: no page errors or horizontal overflow. Visible compact buttons have at least 44px touch targets, with the four playback controls measuring 48px. Bottom navigation remains uncovered.
- Expand and Minimize keep the same iframe connected; queue selection and Close work in all eleven portrait phone cases.
- Actual YouTube playback at 390px: advancing video, unmuted, `readyState: 4`; compact Play and Pause work. The original local paused song and position were restored after checking.
- Desktop player and iframe geometry are unchanged at both checked desktop sizes. Screenshot differences in the larger desktop player were confined to the provider's play-button area, rather than the app layout.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`: passed. The mobile, chat, media, dependency-policy and music suites: 61 passed, zero failed/skipped. `git diff --check`: passed, with normal Windows line-ending notices.

Screenshots and measurements are local evidence under `.codex-temp/mobile-visual-runner/mini-fit/`: `before.json`, `after.json`, and separate `before/after-{width}x{height}-{navigation}.png` captures. Physical-phone and installed-PWA testing were not performed for this revision.

Files changed: `app/dashboard/mobile.css`, `components/music/listen-together-popover.tsx`, and this report.
