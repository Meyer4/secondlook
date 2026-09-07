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
