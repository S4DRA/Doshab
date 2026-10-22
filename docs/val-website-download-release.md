# VAL website and Windows downloads

The public website uses Doshab’s warm paper, black structure, condensed display typography and restrained orange actions. The redesign is scoped to the landing page and its new Windows download page. Existing signed-in app and authentication screens keep their established design and behavior.

## Download flow

- Homepage navigation, hero, Windows section and footer link to `/download`.
- The download page reads the latest stable public release from `S4DRA/Doshab` and displays its actual version and file size.
- `/download/windows` resolves the current `VAL-Setup-VERSION.exe` asset. Only uploaded assets with the exact repository, version, filename and HTTPS URL are accepted.
- If GitHub has no installer, is unavailable or rate-limits requests, the page explains that the download is unavailable and offers browser access. A failed direct download returns to the download page.
- Public release metadata is cached for five minutes. No GitHub token is exposed or required by the website.

## Publishing

Deploy the complete website changes together. Publish all three Windows artifacts as a stable public GitHub release: the setup executable, its `.blockmap`, and `latest.yml`. Draft releases cannot be downloaded by anonymous visitors or used for normal auto-updates.

The Windows workflow builds desktop changes merged into `main` or a `vVERSION` tag matching `desktop/package.json`, runs the desktop checks, and publishes its artifacts after a successful build. A new version in `desktop/package.json` creates a matching release and tag at the built commit. It preserves an existing release and its assets, so increment the desktop version before shipping another native update. Pull requests and manual runs only build test artifacts and do not publish releases.

The desktop app loads the deployed platform, so website UI changes appear after reloading it. Changes to Electron, native window controls or the installer need a new desktop version and release.

## Validation

Download tests exercise stable release parsing, rejected draft/prerelease and foreign URLs, unavailable APIs and redirect recovery. Public pages and download/branding components pass a focused TypeScript check. Changed TypeScript files are linted. The local production build requires network access to download Google Font metadata; public deployment and responsive visual QA must be verified in a reachable preview before production promotion.
