# SecondLook companions — 1.1.0 preview

**More convenient, not all-seeing.** The website cannot monitor other apps or grant itself operating-system permissions. These are separate, optional installations.

## Coverage and limits

| Platform | Automatic capability | Explicit/manual capability | Not available |
|---|---|---|---|
| Android 8+ | With user-granted notification access, inspect available text in selected apps’ notifications and post a local warning when the threshold and OS settings permit. | Share plain text, process selected text, paste checks, passwords, offline playbook. | Private chat databases, hidden/redacted/suppressed notifications, all foreground chat messages, every notification in a burst, and universal interception of in-app links. |
| Desktop Chrome / Edge | Intercept supported HTTP/HTTPS anchor/area click events on approved pages and show an on-page warning before default navigation. Optional, rate-limited OS/browser warnings. | Right-click a link or selection; manual message/URL checks; playbook. | Every navigation, script redirect, form, context-menu “open link”, address-bar entry, download flow, browser-internal page, web chat message, or phone notification. |
| iPhone / iPad | Safari extension source provides supported link-click warnings on sites Safari permits. | Share text/URLs to the native extension; local checks, passwords, playbook. | Cross-app notification access, private conversations, global background scanning, or a website-installable iOS app. |

Android redacts sensitive notification content, including detected OTPs, from untrusted notification listeners. SecondLook does **not** request special sensitive-notification access, disable redaction, or try to bypass this restriction. [1](https://developer.android.com/about/versions/15/behavior-changes-all)

The iPhone Share extension receives only content explicitly supplied to it by a host app’s share flow. [1](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/ExtensionScenarios.html)

## Downloads and installation

Open **https://meyer4.github.io/secondlook/companions.html** for the packages and setup guide once the updated Pages deployment succeeds.

- **Android:** `secondlook-android-preview.apk` is a debug/test-signed preview, not a Play Store release. Review permissions and use a test device first. Do not disable Play Protect or Android’s sensitive-content protections. A later debug build can use another key and require uninstalling this preview.
- **Chrome/Edge:** extract `secondlook-browser-extension.zip`, open `chrome://extensions` or `edge://extensions`, enable Developer mode, and choose **Load unpacked** on the folder containing `manifest.json`. This is not a store-verified installation.
- **iPhone:** `secondlook-ios-project.zip` is source, not an IPA. Generate/open the Xcode project and use appropriate Apple signing to install on a device. Public App Store/TestFlight distribution is not performed here.
- **Safari resources:** `secondlook-safari-extension.zip` contains the web-extension resources with its Safari manifest. Apple also documents an App Store Connect packaging/distribution route; availability, account requirements, review, and privacy disclosures still apply. [2](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)

The website’s `downloads/SHA256SUMS.txt` records package hashes. A checksum is an integrity aid, not proof of safety or an independent audit.

## Permission-first defaults

### Android

- Protection starts **paused**, with **no messaging apps selected**.
- A prominent disclosure precedes Android notification-access settings.
- Warning notification permission and enabled channels are checked separately.
- Per-app allowlist, pause, warning threshold, and 15/30/60-second per-app cooldown controls.
- No `INTERNET`, `READ_SMS`, contacts, accessibility, foreground-service, wake-lock, or sensitive-notification permission.
- No message text, security codes, private links, or passwords in logs or stored history.
- Warnings contain generic rule titles and a source-app label, not the original message. A generic public notification version is provided for the lock screen.
- App selection/settings are saved locally; cloud backup and device transfer are excluded through backup rules. Raw input remains in memory.

Notification access is still a powerful Android permission. Turning off the app’s switch stops processing, but users should revoke the Android permission to remove access completely.

### Browser

- Protection starts paused. Persistent website access is optional in the Chrome/Edge manifest.
- The on/off control and site-access permission are independent. Browser settings can further restrict coverage.
- The guard checks link destinations on activation, not full page text or chat history.
- No continuous DOM observer, background polling, remote reputation service, or analytics.
- Message/URL results are not saved as history. Right-click reports are held only in worker memory, capped at 16, consumed once, and can expire when the browser terminates the worker.
- Optional system warnings contain no source message or link, are disabled by default, and are limited to one per minute.
- The page owns its DOM. A hostile page or another extension can interfere with a DOM overlay; the guard is not an unbypassable browser security boundary.

### iPhone

- No cross-app background message scanning is offered or simulated.
- Share payloads, checks, and generated passwords stay in process memory.
- Safari needs its own website permission and Link Guard setting.
- The native password-copy action requests a local-only clipboard entry with a one-minute expiration. Clipboard safety still depends on the OS and other software.
- There is no upload endpoint, account, or native networking code.

## Battery-conscious, not “zero battery”

Android uses the system-bound notification listener. After allowlist/enable checks, it performs bounded work on one worker thread, with a queue of 32 and a cache of at most 128 short-lived hashes. Idle worker threads time out. No retry timer, polling loop, wake lock, network request, or permanent foreground service is added.

The extension uses click events and an event-driven service worker. Chrome normally shuts down idle extension workers; SecondLook does not keep them alive artificially. See the [official lifecycle documentation](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle).

These choices reduce unnecessary work, but **no battery-drain percentage, OEM reliability, guaranteed background lifetime, or messaging-app coverage figure is claimed**. Device restrictions, queue bounds, duplicates, cooldowns, redaction, and notification grouping can lead to missed checks or delayed warnings.

## Shared rule maintenance

The website remains the source of the English-language rule definitions and playbook:

```bash
npm run sync:companions
```

This copies the JavaScript engine into the desktop/Safari extensions, produces their bundled content script, and exports rule JSON plus 30 common test vectors for the Java and Swift engines.

Native URL parsing is intentionally conservative and is **not identical to WHATWG browser parsing**. Some numeric, Unicode, invalid, or encoded addresses may be normalised differently. Native results therefore say **parsed hostname**, not a guarantee of the browser’s final destination. Do not claim cross-platform behaviour is identical beyond the tested cases.

## Build and test

```bash
npm ci
npm run sync:companions
npm test
npx playwright install --with-deps chromium
npm run test:browser
npm run test:extension
```

Android:

```bash
cd companions/android
# Android SDK 36 + build-tools 36.0.0, JDK 21 (17+ supported by AGP), network for build dependencies
./gradlew :app:testDebugUnitTest :app:assembleDebug :app:lintDebug
```

The app itself does not require a network connection. The Gradle wrapper is checksum-pinned; development dependencies are fetched only by build tooling.

iPhone on a Mac:

```bash
cd companions/ios
brew install xcodegen
xcodegen generate
open SecondLook.xcodeproj
```

The `Verify companion apps` GitHub Actions workflow tests the browser extension and Android build, and builds/tests the iPhone app and extensions using an available iOS simulator on a macOS runner. Simulator artifacts are **not installable on an iPhone**. A successful compile/test run does not establish real Safari permission behavior or real messaging-app coverage.

## Before a public, store-distributed release

1. Independently review notification handling, extension permissions, parser differences, false positives, privacy disclosures, and accessibility.
2. Test physical devices from multiple manufacturers, locked/unlocked states, app foreground/background states, grouped/redacted notifications, DND, burst load, permission revocation, reboots, and battery use.
3. Test real iPhones/Safari and Chrome/Edge permission prompts and site-access choices. Automated browser fixtures do not approve native consent dialogs on behalf of a user.
4. Establish owner-controlled production signing. Never commit a production key, keystore, certificate password, provisioning secret, or access token.
5. Complete store-specific developer registration, sensitive-permission disclosures, privacy/data-safety forms, and review. No store approval is claimed.
6. Keep detection claims modest. These are heuristic aids, not malware scanners or a guarantee that a person, site, or request is legitimate.

Project code: MIT. System framework icons stay within their respective platform apps; bundled project icons are original SecondLook artwork.
