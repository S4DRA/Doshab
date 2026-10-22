# VAL for Windows — first desktop build

This standalone Electron client opens the existing `https://doshab.vercel.app` deployment. It reuses production login, chat, calls, and the existing UI. It does not ship a local Next.js server or require database secrets. An internet connection is required. From 0.1.4, the client starts at the dashboard and supports published desktop updates through GitHub Releases.

## Build and run

From this directory, with Node.js 22 or newer and internet access:

On a regular Windows terminal, you can also run `Build-Windows.cmd` to install the build dependencies, run desktop tests, and produce the installer. The script opens the output folder only after a successful build.

```powershell
npm install
npm test
npm start
```

Build the Windows x64 installer:

```powershell
npm run dist
```

Output: `dist/VAL-Setup-0.1.6.exe`, its `.blockmap`, and `latest.yml`. Install per user; no paid service is required. This installer is unsigned, so Windows may show an unknown-publisher/SmartScreen prompt.

The `Windows desktop installer` workflow builds the installer and all update metadata as artifacts, without publishing. The updater dependency and its generated lockfile are now present; CI uses `npm ci`. The build preflight refuses to package a client without the expected updater dependency; source tests use a mocked updater interface.

## Updating the website and desktop

Saving a file in VS Code changes only that local working copy. Deploy the website change to `https://doshab.vercel.app` to make it available to desktop users. Reloading VAL or fully quitting and relaunching loads the deployed web UI. Closing to the tray keeps the current page alive. Use the tray menu's VAL > Reconnect / reload when ready; this ends active calls. No new installer is needed for normal platform UI and server changes. VAL does not interrupt an active call with an automatic page reload.

Changes inside `desktop/`, such as native window controls, Electron, permissions or installer branding, need a higher desktop version and a new published GitHub release. The desktop updater checks that release feed; it does not watch VS Code files or unpublished commits.

## VAL installer presentation

Version 0.1.6 replaces the personal-install wizard with a frameless Windows WPF interface: a large transparent Echo Sonar mark, moving signal orbit, orange accents, a setup card with folder/shortcut choices, an animated installation screen and a completion screen. It has native keyboard-accessible controls, respects Windows' reduced-motion setting, and pauses animations when minimized. The presentation executable is about 318 KB and runs only during setup. It does not add a browser runtime or a background service to VAL.

`installer/signal-ui.nsh` connects this interface to electron-builder's existing NSIS engine through a private UTF-16 INI file in the installer temp directory. NSIS still owns extraction, registry, shortcuts, old-version removal and uninstall. The interface reports success only after NSIS succeeds; it does not show invented percentages. A manual install asks the user to quit VAL and never silently kills it. `/S` and `--updated` bypass the interface, preserving the updater's standard installer and update metadata. Existing machine-wide installations retain the standard native wizard/elevation path. Windows security dialogs remain controlled by Windows.

`npm run dist` automatically compiles and checks the interface with Windows' .NET Framework compiler. No Python, paid toolkit or new npm dependency is required. `npm run setup:build` builds just the interface and icon assets; `npm run setup:preview` opens a clearly labeled design preview that performs no installation. The committed preview PNG is rendered by the actual WPF layout.

The icon pipeline converts the supplied 1254px artwork into a genuine transparent 1024px master and 512px PNG, plus ten individually rendered Windows ICO frames from 16 to 256 pixels. The original mark's geometry is preserved. Fallback/uninstaller BMP artwork is composited onto its own panel color without a black plate. `installer/native/IconAssets.cs` is the reproducible asset converter.

Validation for 0.1.6: 47 desktop/session tests passed, the native interface compiled, and 16 checks of the real WPF/INI protocol and animation resources passed. All three screens were rendered from the real WPF layout and visually inspected. The packaged app archive was checked for the new icon, scrollbar CSS and updater dependency; the installer UI is excluded from the running app. Full NSIS compilation, real install/upgrade/uninstall and live Windows DPI/keyboard/animation behavior still need verification in a regular Windows terminal: the restricted environment cannot spawn `makensis.exe`. Run `Build-Windows.cmd` and test before publishing. No 0.1.6 release was published here.

## Persistent sign-in and update activation

- The desktop profile remains `persist:val`. Reopening starts at `/dashboard`, where the server either accepts the existing login or redirects to login. No passwords are saved by the native code.
- The native activity file stores only a timestamp. At startup and when returning to an idle client, 30 days without desktop use clears VAL auth cookies. Ordinary user activity renews the timestamp with coalesced writes. Full quit flushes the activity file and Chromium cookie store, including before a requested update restart.
- The website change in `lib/session-token.ts`, `lib/session.ts` and `lib/supabase/proxy.ts` must also be deployed. It changes the legacy cookie/JWT from 8 hours to 30 days and renews verified activity at most daily. Expired/tampered tokens are never renewed; auth endpoints, including logout, are excluded. Supabase retains its existing verified access/refresh-token flow. The native client cannot extend or revive a server-revoked session.
- Desktop updates use the verified public repository `S4DRA/Doshab`, with no GitHub token on end users' machines. The SDK checks 30 seconds after startup, then every six hours. Stable releases download in the background and install on a full app quit. Closing to the tray keeps the process and call running. An immediate restart is optional and warns that active calls end.
- Existing 0.1.3-or-older clients need a 0.1.4-or-newer installer once. Automatic delivery becomes active only after the installer and matching `latest.yml` and blockmap are published. Draft releases are not an active stable feed.

After building and testing the installer, push the source branch, then run:

```powershell
npm run release:draft
```

This requires the GitHub CLI signed into the repository owner account. It creates a draft `v0.1.6` release with exactly the three update artifacts, targeted to the current commit (which must already exist on GitHub). Review it, then publish it on GitHub. Future versions repeat the same build/release process with a higher version. Deploy the associated website auth change before treating the full login requirement as active. Neither the website auth change nor a desktop release was published from this environment.

## Desktop behavior

- The app uses a frameless window with three controls inside the existing VAL header. Version 0.1.5 gives the icons a subdued white on dark buttons, independent of the website theme. Drag the empty header space or its title to move VAL; buttons, links, call forms and accessible widgets are excluded from the drag region. The six-dot grip remains available, with a wider drag area on login and offline pages. Double-click the draggable header to maximize/restore. F11 enters/exits fullscreen. There is no separate title strip.
- The current Echo Sonar logo is used by the installer, taskbar and tray. Right-click the tray icon for the application menu.
- Version 0.1.6 hides desktop scrollbars while preserving wheel, touchpad, keyboard and touch scrolling. It does not set `overflow: hidden` on scrollable views.
- Persistent sign-in in a dedicated Chromium profile, separate from your browser, with a 30-day desktop inactivity policy.
- One app instance. Closing the window keeps VAL in the Windows tray. Use the tray menu or VAL → Quit VAL to exit and end calls. No startup registration.
- Remote pages have no Node access or exposed preload API. The sandboxed, isolated preload installs the window-control buttons without exposing JavaScript functions to the site. Trusted button clicks can request only minimize, maximize/restore and close-to-tray; main-process handlers check the sender and main frame. Screen-picker IPC remains restricted to its local window.
- Microphone, camera and notification requests have explicit session-scoped approvals. Camera approval is separate from microphone approval. Reset approvals from the VAL menu. Resetting approvals does not stop an already active capture; use call controls to stop it.
- Screen sharing shows a source picker every time. System audio is opt-in and can include call audio. Unplugging or closing a source must be checked on a real Windows machine.
- External links open in the default browser. Downloads prompt for a save path. Fullscreen and zoom use standard Windows menus.
- Push-to-talk currently requires VAL to have keyboard focus. Global push-to-talk is not implemented. Notifications, including service-worker push, need real-machine verification; Electron is not a guarantee of browser push-service compatibility.
- Automatic desktop updates are supported by 0.1.4 once the seed installer and stable update feed are published. Tray Help provides Check for updates and Restart to install update. Restart is never forced during a running app session.

## Performance choices and acceptance

One live app renderer with three custom window controls; no separate title-strip renderer, background helper server, analytics process, game overlay or constant diagnostics sampler. A DOM observer reattaches controls after route changes; there is no polling timer. It disconnects while the document is hidden and does not scan the document for ordinary text updates. Maximize-state changes reuse the existing icon node. V8 uses `bypassHeatCheck` code caching with lazy compilation; startup benefit is not yet benchmarked.

Desktop-only CSS removes backdrop blur from the chat composer and command backdrop, disables the looping command-button glow and landing voice-dot pulse, and pauses CSS animations while hidden. Layout, click feedback, microphone/camera capture, audio processing, video resolution, bitrates and notification polling retain their existing behavior. Hardware acceleration and Chromium background throttling stay enabled. Existing VAL visualizers skip drawing when hidden. Audio and WebRTC behavior while minimized must be tested; do not disable all background throttling as a blanket fix.

Right-click the VAL tray icon → Help → Save performance snapshot exports Electron's process CPU and working-set metrics, GPU feature status, and an on-demand renderer snapshot with server-wait/interactive/load timings, DOM-node count and resource count. It excludes account data and request URLs. Memory units follow Electron AppMetrics (kilobytes). This is a point sample, not a benchmark or FPS measurement; a nonzero server-wait interval includes server and network effects, not only UI execution.

## Sharing and website downloads

Send only the finished `VAL-Setup-0.1.6.exe` installer to testers. They do not need Node.js, source code, your account, or build commands. They install it, then sign in or register normally. The blockmap and latest.yml are needed on the release host for future automatic updates.

For a public website button, upload the installer to a public release or file host and link the button to that hosted asset. A local `C:\...` path or ChatGPT file link is not a public download URL. GitHub Releases can host the installer: if the source repository is private, use a separate public downloads repository so people can download without receiving source access. Do not make a private source repository public just to host downloads.

A website button can link to `https://github.com/S4DRA/Doshab/releases/download/v0.1.6/VAL-Setup-0.1.6.exe` after that actual public release exists. This is the configured release pattern, not a claim that a release was uploaded. Once users install the update-enabled seed version, later published desktop versions can arrive automatically.

Before calling this release ready:

1. Verify fresh install, launch, login, restart/sign-in persistence, tray restore and quit. Test offline launch and reconnect.
2. Two real accounts: chat, incoming notifications, microphone permissions, voice, mute/deafen, camera and device changes. Test calls for at least 15 minutes with VAL visible, minimized, and closed to tray. Check silent incoming calls as well as active audio.
3. Test screen and single-window sharing, cancel, stop, share again, source closure, monitor changes and opt-in system audio. Check for echo and stop all capture indicators on leaving a call.
4. Benchmark the same repeatable game scene with VAL closed, idle in tray, in a voice call, and screen sharing. Repeat each case three times; record average FPS, 1% lows, VAL CPU, memory and GPU usage. Compare both visible and tray cases. Target ≤3% regression for voice-only is an acceptance goal, not a measured claim. Screen sharing has a separate quality/performance cost.
5. Verify focus-only push-to-talk behavior and make that limitation clear to early testers. Decide whether global push-to-talk is required before rollout.

## Local validation on 2026-10-22

Version 0.1.4: 46 tests passed (37 desktop tests with mocked platform boundaries, plus 9 real-crypto session/proxy tests). The focused TypeScript check for session-token, session-cookie and proxy code passed. This includes native inactivity expiry on startup and return from the tray, cookie flushing, updater scheduling and restart behavior, signed-token renewal and logout/expiry rejection. The updater SDK could not be downloaded because registry DNS is blocked, so native packaging and a two-version update test remain blocked. The build preflight correctly rejects packaging without that SDK. The existing `dist/win-unpacked` still contains the previous 0.1.3 preview; do not treat it as an update-enabled 0.1.4 build.

Desktop boundary tests run with Node only and mocked Electron interfaces. They verify isolation configuration, origin restrictions, permission handling, capture consent/cancellation and IPC sender checks. They do not validate actual Electron execution, audio quality, notification delivery, capture or FPS.

Version 0.1.3 result: 24/24 desktop tests passed, including icon validity, control IPC sender/action restrictions, F11 handling, header mounting/remounting, synthetic-click rejection, fullscreen state, subframe/origin isolation, CSS-line icon identity, background observer suspension and desktop CSS application. Across 1,000 synthetic unrelated DOM updates, no extra document selector queries occurred in the control-mounting code. This is a deterministic code-path check, not a real-world CPU/FPS result. These tests use mocked Electron and DOM interfaces; actual visual placement and native controls still need checking on Windows. JavaScript syntax checks passed. The GitHub connection can read the repository but returned HTTP 403 (`Resource not accessible by integration`) when creating a branch; no remote branch, PR or CI build was created. Changes exist on the separate local branch `codex/val-windows-desktop`, not in the original `D:\Exairon Github\Doshab` folder. Only the new desktop directory and Windows workflow belong to this change; excluded local caches and unrelated existing modifications must not be committed.

The user successfully built versions 0.1.0 and 0.1.1 from a regular Windows terminal. Version 0.1.3 was packaged successfully into `dist/win-unpacked/VAL.exe`; ASAR inspection confirmed its version, CSS-line icon preload and desktop-effects stylesheet. It can be tested directly from that folder after quitting the installed app. This restricted execution environment previously could not spawn the NSIS installer compiler (`spawn UNKNOWN`) or complete the native Electron smoke test. The 0.1.3 installer must be built in the regular Windows terminal; the new icon appearance, call quality, startup times and gaming FPS have not been measured on the user's computer. Screenshot materialization and live browser timing APIs were unavailable during this pass. Electron was selected to support explicit Windows source selection through desktopCapturer and use Chromium for the existing WebRTC code. No claim is made that it is faster than Tauri.

Development only: `$env:VAL_DESKTOP_URL = 'http://localhost:3000'` before `npm start`. Packaged builds ignore this override. Changing the production domain requires reviewing `policy.cjs` and rebuilding.
