# VAL appearance and media settings

Implemented 2026-10-09. This is a targeted settings/media change; it does not advance the Interaction Physics phases.

## Changes

- Exposes the existing ten palettes in Settings → Appearance, with dark/light mode. Saved choices load throughout the authenticated shell. Semantic accents now follow the selection instead of being forced to orange. Signal Orange retains the approved default color and existing composition. Action text is selected for readable contrast.
- Profile photo uploads accept up to **2 MiB (2,097,152 bytes)**, including the exact boundary, on both the client and authenticated server route.
- Profile photos, shared Space pictures, and both personal sidebar images use the same crop/zoom/position dialog. The native range controls support keyboard arrows; Cancel preserves the current/prepared image. Profile/Space changes remain pending until the existing settings form is saved. Personal artwork continues to use account-scoped device storage.
- Remote URL adjustment requires permission from the image host to read canvas pixels. A visible original-URL alternative preserves existing URL functionality; uploading the image also works. Adjusted GIFs become still images; keeping the original preserves their format.
- Bounded Space uploads are stored in the existing image column, following the existing profile data-URL approach, rather than writing ephemeral files into `public/`. Existing URLs remain supported. No schema or migration change. Owner/admin checks are retained. Large original images can increase database payloads; adjusted images are capped at 640 pixels for profiles and 1280 pixels for other settings, and personal artwork keeps its existing 256 KiB storage budget.
- Camera/screen tiles open an enlarged viewer through the video or its enlarge control. The viewer has native fullscreen, a visible close control, existing PiP behavior, and failure feedback. Closing only releases the viewer's DOM player; persistent call ownership, audio and source tracks remain unchanged. A departed/stopped share removes the viewer. Fullscreen failure leaves the enlarged view usable.

## Files

- Themes: `lib/themes.ts`, `components/theme/theme-selector.tsx`, `components/theme/use-doshab-theme.ts`, `components/theme/theme-preferences.tsx`, `components/profile/profile-settings-panel.tsx`, `app/dashboard/profile/themes/page.tsx`.
- Shared editor/validation: `lib/image-upload.ts`, `lib/image-adjustment.ts`, `components/ui/image-adjustment-dialog.tsx`, `components/profile/settings-image-field.tsx`.
- Image settings: `components/profile/{profile-form,sidebar-artwork-settings}.tsx`, `app/api/profile/route.ts`, `app/dashboard/groups/[groupId]/settings/page.tsx`, `app/api/groups/[groupId]/settings/route.ts`.
- Media: `components/calls/call-workspace.tsx`, `lib/media/fullscreen.ts`.
- Styling/integration: `app/dashboard/{layout.tsx,val-design.css,settings-media.css}`.
- Tests: `tests/settings-media.test.mjs`, `package.json` (included in existing CI appearance suite).

## Verification

- `npm run lint`: exit 0, no warnings/errors.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: exit 0.
- All existing suites plus settings/media tests: **104 pass**, 0 failures/skips.
- `npm run build`: exit 0; all 47 static pages generated.
- `npm run audit:dependencies`: policy passed. Existing five high dev-only linter-chain findings remain under the documented exception through 2026-10-17; production audit passed.
- Authenticated local browser: all ten dark accents apply; light mode and reload persistence verified. Desktop/390 × 844 settings have no horizontal overflow. Crop sliders have accessible names, arrow keys update their values, Cancel preserves the current image, and mobile Back closes the dialog and restores focus. Public VAL imagery is used for preview checks; no private file was uploaded.
- Automated file selection is unavailable because Opera's extension lacks file-URL access. The same editor is checked via its existing URL flow. In the authenticated Space form, a public same-origin URL was adjusted, previewed, and installed as `imageUpload-adjusted.webp` in the native file input; the form correctly said it still needed saving. The unsaved QA change was discarded by reload. Upload boundaries also have targeted tests.
- **Not verified with real clients:** live camera/screen enlargement, native fullscreen on each supported browser, Safari's native-video fallback, or device-level accessibility. Component tests cover selecting each stream and closing without modifying media; fullscreen tests cover standard, fallback, unsupported and ownership cases.

Desktop/mobile screenshots are local QA artifacts under `.codex-temp/`; they are not product assets.
