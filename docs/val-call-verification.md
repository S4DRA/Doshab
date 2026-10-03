# VAL call verification

The call client uses Supabase Realtime presence to discover every session, one initial WebRTC offerer, and four stable media sections: microphone, camera, screen, and shared audio. Camera and screen have separate selectable views. Leaving releases capture before waiting on signaling.

## Room visibility and controls

Auto layout shows a gallery when more than one person is present and focuses a shared screen when one starts. Gallery keeps cameras and screens together; Focus pins a chosen view. A stopped share or departed participant restores Auto if its view was pinned. Participants remain listed regardless of the visible video page.

Gallery and the focus strip page six views at a time. Hidden full-size players are unmounted, and the selected focus view does not also play in its thumbnail. Remote audio remains owned by the persistent session, so selecting or paging views does not stop hearing people. Local camera previews are mirrored; shared screens are not. Focus-view labels sit above live video to avoid covering the shared content.

Microphone, camera, and share have independent pending states and duplicate-action guards. A camera/share permission prompt leaves microphone, deafen, and Leave available. The lobby's Join muted option applies to that call without changing saved voice settings. Camera and screen start off.

Controls stay at the bottom of the room scroll area. Smaller desktop windows use a compact header; tablet voice pages reserve the navigation rail's width. Mobile view strips can grow to show their labels, and More exposes camera/share/deafen/device controls with Escape dismissal and focus return.

## Verified on 2026-10-03

- `npm run test:media`: 20 passing lifecycle, signaling, media-view, automatic-layout, pin recovery, paging, and multi-session participant-state tests.
- Native WebRTC integration with simultaneous join: bidirectional decoded audio, concurrent camera/screen/share audio, independent source stop/restart, departure cleanup, and rejoin passed. These use synthetic inputs, not physical devices.
- Opera browser against the local app: muted join, real microphone activation and mute, real camera playback (640×480), concurrent selected-screen playback (1920×1080), gallery/focus selection, and stopping camera while sharing passed. Pending screen selection kept mic/camera/Leave enabled.
- Browser viewport checks at 320×568, 390×844, 820×600, and 1280×720: no horizontal overflow, accessible mobile More controls, deafen feedback, Escape dismissal/focus return, and visible Leave. The tablet rail overlap and clipped mobile view-strip layout were corrected.
- Pop-out, navigation to Messages, and Return to call retained the room connection and original session duration. Switching gallery/focus does not reset the displayed elapsed time.

Live speech between two distinct signed-in accounts, physical-phone/browser testing, large-room frame-rate profiling, and relay delivery across restrictive networks remain separate acceptance checks. Single-account camera/screen playback and native integration are not substitutes for these checks.

## Automated checks

`npm run test:media` runs the isolated lifecycle/signaling regression suite. CI runs this suite, lint, audit, and a production build. The suite does not verify real RTP or browser permissions.

`node tests/media-rtp.integration.mjs` additionally uses real Supabase Realtime and native WebRTC to check decoded audio in both directions, simultaneous camera/screen frames, source stop/restart, mute metadata, departure, and capture cleanup. It creates a random signaling room without creating application accounts or database records. Its audio tones and video frames are synthetic test inputs.

For the optional integration test, install `@roamhq/wrtc` in a separate test-runtime directory and set `WRTC_MODULE_PATH` to that package's absolute path. Public Supabase configuration is read from `.env`, `.env.local`, or the process environment. Run with `MEDIA_JOIN_ORDER` set to `forward`, `reverse`, and `together`. The native wrapper adapts its older explicit-description API; it does not substitute a browser/device acceptance check.

## Browser acceptance

Use two existing accounts in the same room with separate browser sessions. Check both profiles, audible speech in both directions, muted join, camera and share together, selecting each view, stopping either source, deafen/resume, navigation/pop-out, and leave/rejoin. Check desktop and narrow mobile layouts. Screen capture must be selected through the browser's sharing picker.

## Relay configuration

For networks that block direct peer connections, configure `MEDIA_TURN_URLS` and `MEDIA_TURN_SECRET` on the server. The relay must support TURN REST shared-secret authentication (for example, coturn). The token routes return expiring credentials to authorized room members; the shared secret remains server-side. This code does not provision a relay. Without these settings, calls use STUN and direct connectivity only. Relay delivery needs a separate test across restrictive networks.
