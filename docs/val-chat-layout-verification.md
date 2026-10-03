# VAL chat layout and installed mobile verification

## Result

Chat rooms use separate ivory cut-corner header, search/tools, conversation and composer panels from the supplied reference. The existing dark primary rail, space navigation and contextual people rail retain real account, channel and membership data. Space artwork uses the existing lunar asset or the space's supplied image.

Channel sections have working disclosures, current-page states and management links gated by the existing owner/admin role. The mobile Channels, Members and More sheets preserve navigation and invite/settings permissions. Members reuse the existing people list with search, online filtering, bounded initial rendering and accepted-friend actions. No additional polling, authentication changes, database changes or media transport changes were introduced.

Chat controls include text sending, replies, emoji insertion, loaded-message search, pins, polls and voting. Message web links use explicit HTTP/HTTPS addresses and do not link credential-bearing URLs. Poll submission and voting expose pending states; pin/reaction/vote, encryption setup and pinned-list failures show errors. Failed sends preserve text typed while the request was in flight. Oversized restored drafts require splitting before sending. Incoming messages preserve the reader's scroll position and offer a jump to the latest message.

## Mobile and installed layout

The page already emits one device-width viewport declaration with initial-scale=1, viewport-fit=cover and interactive-widget=resizes-content. The push worker does not cache HTML. The user's particular installed-phone scaling report has not been reproduced on a physical phone.

Installed touch windows up to 1024 CSS pixels use the mobile composition, including bottom navigation and bounded sheets, rather than the width-only desktop rail. The mobile base font is 16px and chat body text is 17px. Short installed windows have a compact header/composer. Keyboard measurement handles both a shrinking visual viewport and Android's resized layout viewport; it refreshes on launch/restore, visibility and orientation events and preserves user pinch zoom.

Only the saved PDF research page covering text size and keyboard geometry was available; the original PDF was no longer at its supplied filesystem path. The supplied chat screenshot and the current application's real data were the implementation references.

## Verification

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run test:chat`: six tests cover URL preservation/safety, iOS/Android keyboard geometry, rotation/restoration and pinch zoom. Passed; added to CI.
- `npm run test:media`: all 20 existing lifecycle and call-view tests passed.
- `npm run test:audit`: all six guard tests passed.
- `npm run audit:dependencies`: passed. Production has no findings; the existing five development-chain findings remain under the unchanged exception through 2026-10-17.
- `npm run build`: optimized build passed.
- Local optimized-build HTTP smoke: public/login/manifest routes, authenticated-route protection, 20 style/font assets, 16 font files and supplied brand-image hashes passed.
- Local browser checks: sending and persisted acknowledgement; quoted reply with emoji; pin and pinned-list result; loaded-message search and return focus; poll creation with disabled pending controls and persisted vote; member search/empty results/self disclosure; channel collapse; notification access.
- Responsive inspection: 320x568, 390x844, 820x600 and desktop. No horizontal overflow observed. At 820px, the content begins at the 72px primary rail edge; the composer remains within the viewport.

Most chat interactions were performed with the keyboard after Opera's mouse-command timeout. Screenshot/DOM inspection continued to work, and native accessibility actions subsequently worked for the profile popup check. Physical touch, installed iOS/Android behavior, offline failure injection, new-message arrival during reading and two-account call audio were not independently exercised in this change. The exact phone model/browser is still needed to verify the user's installed scaling report. Existing live voice behavior was previously reported working by the user.

## Follow-up visual corrections

Mobile sender headers reserve 44px for the message-actions touch target. Local and production geometry checks confirmed that text, quoted replies and polls start below the control rather than overlapping it.

The profile popup had inherited `position: relative` from the shared `app-surface` styling. It became the first sidebar flex item, opened at the top and displaced navigation. A profile-specific fixed-position rule restores the existing bottom anchor without changing its settings or logout actions. The optimized local build was checked at 1440x900 and 390x844: the desktop popup sits to the right of the primary rail, the brand remains at its original top position, and the mobile popup ends above bottom navigation. Mobile opening and closing were exercised through the native accessibility controls.

## Files changed

- `.github/workflows/ci.yml`
- `app/dashboard/val-design.css`
- `app/globals.css`
- `components/chat/channel-header-actions.tsx`
- `components/chat/message-list.tsx`
- `components/chat/realtime-message-panel.tsx`
- `components/groups/channel-list.tsx`
- `components/layout/dashboard-shell.tsx`
- `components/layout/dashboard-sidebar.tsx`
- `components/layout/people-rail.tsx`
- `components/layout/val-viewport.tsx`
- `components/ui/dialog-surface.tsx`
- `lib/chat-presentation.ts`
- `lib/viewport.ts`
- `package.json`
- `tests/chat-presentation.test.mjs`
- `docs/val-chat-layout-verification.md`
