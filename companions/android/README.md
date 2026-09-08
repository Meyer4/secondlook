# Android companion preview

This is a small native Java app with no runtime library dependency and **no Internet permission**. It is not a Google Play release or a guarantee of protection.

## Setup on your own test phone

1. Review the source and the powerful notification-access permission before installing the non-debuggable, preview-signed APK.
2. Allow SecondLook to post warning notifications.
3. Read the disclosure and, if you consent, enable SecondLook in Android’s Notification access settings.
4. Select apps. **The initial allowlist is empty.**
5. Enable local checks and return to the app to inspect its connection state.
6. Test using fictional messages from another device. The source app must actually post readable notification text. Muted, redacted, hidden, foreground-only, grouped, restricted-profile, or undelivered notifications may not be available.

Do not disable Play Protect or Android’s sensitive-notification protections. If the OS restricts a sideloaded listener, respect and review that restriction rather than treating it as a defect to bypass.

## What it does

A system-bound `NotificationListenerService` ignores unselected apps and its own notifications, extracts bounded available text, deduplicates in memory, and runs a native rule engine on a single bounded worker. Strong-warning results can trigger a generic local warning, subject to permissions, DND/channel settings, and a per-app cooldown.

It does **not** open messages, fetch links, block other apps, access SMS storage, read private chat databases, scan files, or use an accessibility service. `Share → SecondLook` and selected-text processing are separate, explicit user actions.

No message body or generated password is stored. Settings/selected package names stay in app preferences. Short-lived deduplication hashes stay in RAM. Backup/data-transfer exclusion rules are included. The preview's check screens use `FLAG_SECURE` to limit screenshots/recents exposure; the operating system ultimately controls capture behavior.

## Build

First run `npm run sync:companions` from the repository root. Then, with JDK 21, Android SDK 36, and build-tools 36.0.0 installed:

```bash
./gradlew :app:testDebugUnitTest :app:assemblePreview :app:lintPreview
```

Output: `app/build/outputs/apk/preview/app-preview.apk`.

The wrapper distribution is checksum-pinned. The wrapper itself is third-party Gradle code under its included Apache-2.0 licence (`gradle/wrapper/LICENSE.txt`); the SecondLook app source is MIT.

## Before distributing beyond a preview

Use an owner-controlled production signing key and complete store/privacy/permission reviews. Version 1.3 shows as SecondLook but uses a separate package identity, so it can be installed alongside the earlier 1.1 app. It is not an in-place update. Configure its permissions and app selections again, and disable the older listener to avoid duplicate alerts. Preview signing keys are not a production update-continuity solution. Never commit signing keys or bypass device security controls. Real phones, OEM battery restrictions, notification redaction, permission revocation, foreground chats, and app variants still need manual testing. No physical-device battery result is claimed.

## Version 1.3 design and hardening

The app now has five organised screens, a native bottom navigation bar, Prism backgrounds with optional foreground-only motion, local Manrope typography, and real permission/selection status. Robolectric native-graphics renders exercise the actual Android views; they are not photographs of a physical device. The Manrope font uses its included SIL Open Font License in `app/src/main/assets/Manrope-OFL.txt`. See `docs/SECURITY-REVIEW-1.2.md` at the repository root for the focused review and its limitations.

The header Light/Dark switch and Settings appearance picker preserve current text and passwords. The Live background switch can disable visual motion, and Android’s Remove animations setting is respected. The prior temporary-key 1.2 preview may need removal if its signature differs; never disable Android security controls to force an install.
