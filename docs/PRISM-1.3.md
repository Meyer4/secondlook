# SecondLook Prism — finished visual update, version 1.3

## What changed

The approved screen layout is retained, but the green-heavy appearance has been replaced with violet, blue, cyan, and rose. This is more than a colour swap:

- **Web:** a perspective-projected glass-eye object with depth faces, moving orbital rings, layered UI plates, dimensional cards, and a sparse animated aurora/constellation backdrop.
- **Android:** a matching dimensional glass-eye emblem, raised surfaces, local Manrope typography, a foreground-only aurora background, and the existing five-screen navigation.
- **Light and dark modes:** both are complete palettes. Web controls are in the top bar. Android has a header switch and Light/Dark/System controls in Settings.
- **Motion control:** the web Motion button and Android Live background switch turn decorative motion off. Reduced-motion preferences are respected.
- **Preserved content:** changing the theme keeps the current web input, Android text input, and generated Android password. Display preferences alone are saved, not message/check history.
- **Matching companions:** the download catalogue and browser popup use Prism palettes. The iPhone source has adaptive colours and a Light/Dark/System appearance control; its Share extension follows system appearance.

## “Live” means visual motion, not a live threat feed

No fake security score, live scam count, message-feed connection, or universal protection status is added. The website still cannot read phone messages. Its moving backdrop is decoration.

The web animation loop is capped at 24 rendered frames per second, pauses on document hiding, and does not run when reduced motion is requested. Android visual updates are scheduled at most once every 80 ms while the view is attached, visible, foregrounded, and focused. `onPause` explicitly suspends native visual callbacks. The notification listener does not create visual views or run their timers.

These are bounded implementation choices, **not a measured battery-drain or performance guarantee on every device**. Turn Motion off if preferred. No external 3D library, CDN, analytics, or network rendering service is required.

## Preserved functionality and security work

Message/link checks, warning explanations, password generation, safety guides, local checklist controls, Android per-app notification choices, local warnings, browser link interception, pause/sensitivity/cooldown controls, and offline support remain.

The prior input-boundary hardening, synthetic-click boundary, non-debuggable APK configuration, restricted permissions, CSP, pinned Actions, and configured code scanning remain. See [the focused review](SECURITY-REVIEW-1.2.md). This is not an independent audit or an “unhackable” claim.

## Local verification (7 September 2026)

- 58 Node unit/security-boundary tests passed.
- 32 Chromium web tests passed, including both themes, narrow/wide layouts, theme persistence without storing input, motion on/off, reduced motion, offline reload, and the network-free portable preview.
- 9 browser-extension tests passed.
- 18 Android JVM test methods passed, including 30 shared rule vectors plus native UI/security/appearance checks. Native screens were rendered in both themes using Robolectric native graphics.
- The Android preview assembled; lint completed; inspection confirmed a valid APK signature, no debuggable flag, the separate preview package identity, and only the notification-posting runtime permission.

An initial resource-heavy parallel local run timed out; the same web suite passed when run with one worker. This environment has limited memory. This was not converted into a fake success claim or a battery benchmark.

The current iPhone source still requires a fresh macOS/Xcode build check and Apple signing for device installation. Hosted CodeQL/build execution requires publishing this revision. Those results must not be inferred from the local tests above.

## Installation notes

The APK is a preview-signed, non-debuggable **SecondLook Preview** app (`io.github.meyer4.secondlook.preview`), not a Google Play release. It can coexist with the original 1.1 app. Configure its permissions and app choices; disable the old listener to prevent duplicate alerts.

If you installed a previous workspace-only 1.2 preview, its temporary signing key may differ. Remove that preview if Android reports a signature conflict. Do not disable Play Protect or sensitive-notification protections. Owner-controlled production signing is still needed for a normal long-term update path.
