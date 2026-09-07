# Prism 1.3 — current local verification

The visual request is implemented for Android and web: multicolour surfaces, dimensional graphics, live backgrounds, and light/dark controls. The complete local verification record and limits are in [docs/PRISM-1.3.md](../docs/PRISM-1.3.md).

**Passed locally:** 58 Node/security-boundary tests, 32 web browser tests, 9 extension tests, and 18 Android JVM test methods. The Android preview APK builds, passes lint, and is verified non-debuggable with the expected permission set. Theme changes preserve inputs/passwords, and reduced motion is respected. Native images are Robolectric view renders, not device photographs.

**Not yet established for this revision:** the hosted Xcode/CodeQL runs, physical-phone battery use, real Safari permission behavior, store acceptance, universal notification coverage, or an independent security audit.

---

## Earlier verification history

# Version 1.2 design/hardening verification

**Local checks, 7 September 2026**

- 58 Node unit/security-boundary tests passed.
- 25 Chromium web-interface tests passed, including responsive layouts, six accessibility states, offline reload, and the portable sandbox preview.
- 9 Chromium extension tests passed, including the new synthetic-click boundary.
- 16 Android JVM tests passed (10 core tests plus 6 native UI/security tests). The core suite includes 30 shared rule vectors.
- Native Android home, check, password, guide, and settings views were rendered with Robolectric native graphics. These are real view-tree renders, **not physical-device screenshots or device battery tests**.
- The `preview` APK assembled and lint completed. Built-APK inspection confirmed the separate `io.github.meyer4.secondlook.preview` identity, no debuggable flag, only the notification-posting runtime permission, and a valid APK signature.
- npm audit reported no known advisories in the installed npm dependency set. This is not a zero-vulnerability guarantee.

GitHub CodeQL and the updated hosted build workflows are configured for this version. **Their 1.2 execution results are pending publication; local checks are not a substitute for a successful hosted run.** See [the focused review](../docs/SECURITY-REVIEW-1.2.md) for scope and remaining risks.

Version 1.2 is preview-signed, not a store-reviewed production release. It installs alongside 1.1; configure its permissions and app selections again and disable the older listener to avoid duplicate alerts. Owner-controlled signing is still needed for a normal production update path.

---

## Historical 1.1 verification

# Companion verification — 7 September 2026

## Verified locally

- **Web engine:** 52 Node unit tests passed.
- **Existing web interface:** 25 Chromium browser tests passed after the companion integration, including offline reload and the opaque-origin standalone preview.
- **Desktop extension:** 8 Chromium extension tests passed. They cover paused/no-host-access defaults, pre-navigation interruption, ordinary navigation, pause changes on existing pages, strict shortener warnings, no scan-history storage, offline checks, and an explicitly unprotected scripted-navigation case.
- **Android:** 10 JVM unit-test methods passed, including 30 cross-platform rule vectors, input limits, URL user-info parsing, in-memory deduplication, bounded cache size, cooldowns, severity controls, and secure password generation.
- **Android build:** the debug APK assembled successfully with Android SDK 36 and JDK 21. Android lint completed without errors. Non-fatal warnings about newer development-tool/dependency versions and English UI literals remain.
- **Artifact identity:** the public Android preview is debug/test-signed. SHA-256 download checksums are supplied. It is not a production-signed or store-reviewed release.

## Verified on GitHub Actions

Functional code commit: **`2ff38a770edbe7d7ab1de16e39f370e118e90fb8`**.

The [companion verification run](https://github.com/Meyer4/secondlook/actions/runs/34127995272) completed successfully on 7 September 2026:

- **Browser extension:** the shared Node unit tests and all 8 Chromium extension tests passed.
- **Android:** native unit tests, debug APK assembly, and Android lint passed on the hosted runner. The CI APK is a separate debug-signed artifact, not necessarily signed with the same key as the website preview APK.
- **iPhone / Safari:** the Swift app, Share extension, and Safari extension wrapper built successfully. All **5 XCTest methods passed with 0 failures**, including the 30 common rule vectors, on an **iPhone 17 Pro simulator**. The earlier Safari bundle-layout problem was corrected before this successful run.
- **Website:** the [Pages deployment](https://github.com/Meyer4/secondlook/actions/runs/34127995248) succeeded. The live companion page and all five download/checksum files returned HTTP 200; downloaded package hashes matched the workspace files.

This record is a documentation-only follow-up to that tested commit; it does not change app code or the published packages. Simulator success is **not** real-phone verification or Apple signing. The downloadable iPhone package remains source code, and the simulator app artifact cannot be installed on a phone.

## Testing boundaries

- The automatic browser tests use a **test-only manifest with fixture host access pre-granted**. The distributed Chrome/Edge manifest retains optional website permissions. The suite does not approve or fully validate a human user’s native browser-consent dialog.
- Android notification listener behavior has **not** been exercised end-to-end against real WhatsApp, SMS, Messenger, Telegram, Instagram, or Facebook installations on physical devices.
- iPhone Share-sheet availability, Safari website permission behavior, and Safari DOM-warning operation still require real-device verification.
- No battery-drain percentage, reboot reliability, OEM power-management result, store acceptance, scam-detection accuracy, or guarantee of full coverage has been established.
- Native URL parsers can differ from browser WHATWG parsing. The 30 shared cases are regression fixtures, not proof of universal equivalence.
- No independent security review, penetration test, accessibility certification, or app-store audit is claimed.

Use a test device/browser profile first. Respect operating-system privacy restrictions, and never disable OTP redaction or Play Protect to make this preview appear more capable.
