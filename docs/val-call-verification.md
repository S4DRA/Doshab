# VAL call verification

The call client uses Supabase Realtime presence to discover every session, one initial WebRTC offerer, and four stable media sections: microphone, camera, screen, and shared audio. Camera and screen have separate selectable views. Leaving releases capture before waiting on signaling.

## Automated checks

`npm run test:media` runs the isolated lifecycle/signaling regression suite. CI runs this suite, lint, audit, and a production build. The suite does not verify real RTP or browser permissions.

`node tests/media-rtp.integration.mjs` additionally uses real Supabase Realtime and native WebRTC to check decoded audio in both directions, simultaneous camera/screen frames, source stop/restart, mute metadata, departure, and capture cleanup. It creates a random signaling room without creating application accounts or database records. Its audio tones and video frames are synthetic test inputs.

For the optional integration test, install `@roamhq/wrtc` in a separate test-runtime directory and set `WRTC_MODULE_PATH` to that package's absolute path. Public Supabase configuration is read from `.env`, `.env.local`, or the process environment. Run with `MEDIA_JOIN_ORDER` set to `forward`, `reverse`, and `together`. The native wrapper adapts its older explicit-description API; it does not substitute a browser/device acceptance check.

## Browser acceptance

Use two existing accounts in the same room with separate browser sessions. Check both profiles, audible speech in both directions, muted join, camera and share together, selecting each view, stopping either source, deafen/resume, navigation/pop-out, and leave/rejoin. Check desktop and narrow mobile layouts. Screen capture must be selected through the browser's sharing picker.

## Relay configuration

For networks that block direct peer connections, configure `MEDIA_TURN_URLS` and `MEDIA_TURN_SECRET` on the server. The relay must support TURN REST shared-secret authentication (for example, coturn). The token routes return expiring credentials to authorized room members; the shared secret remains server-side. This code does not provision a relay. Without these settings, calls use STUN and direct connectivity only. Relay delivery needs a separate test across restrictive networks.
