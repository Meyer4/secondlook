# iPhone / iPad and Safari companion source

This directory is **source code**, not an installable IPA. It contains:

- A SwiftUI app with local link/message checks, password generation, and a playbook.
- A Share extension that checks text/URLs explicitly supplied by a host app.
- A Safari web-extension wrapper and bundled JavaScript resources.
- Shared native rule JSON, 30 cross-platform test fixtures, and XCTest methods.
- An XcodeGen project specification and privacy manifests for review.

## Build on a Mac

Use Xcode with an iOS 17+ SDK and XcodeGen:

```bash
brew install xcodegen
xcodegen generate
open SecondLook.xcodeproj
```

Before generating from a repository checkout, run `npm run sync:companions` in the repository root. The source ZIP already includes the generated rules and Safari resources.

Select the **SecondLook** scheme. For a physical device, select your own development team and appropriate bundle IDs for the app and both extensions. Use Xcode’s signing workflow. App Store/TestFlight distribution requires Apple’s developer-account, privacy-disclosure, signing, and review processes; none are completed or claimed by shipping this source.

The GitHub Actions macOS job uses an available iPhone simulator and `CODE_SIGNING_ALLOWED=NO`. Its output cannot be installed on a phone.

## Use after a signed build is installed

- Share a link or text and choose **Check with SecondLook**. Not every app exposes text to sharing. Photos and attachments are not scanned.
- Enable **SecondLook Link Guard** in Safari's Extensions settings, grant website access, and turn on Link Guard in its controls. Reload websites after permission changes.
- Use the native password maker and playbook without a network connection.

## Important platform boundaries

iPhone apps do not have Android-style access to other apps’ notifications or private chat databases. There is no hidden background message-monitoring service in this project, and there is no toggle that pretends to enable one.

Safari protection is limited to supported link-click events on permitted pages. It cannot cover all script navigation, redirects, forms, address-bar entries, browser-internal pages, or other apps’ in-app browsers. Safari system-notification warnings are not offered by this preview.

Native URL parsing is not identical to browser WHATWG parsing. Swift and Java share rule definitions and regression cases, not a guarantee of identical behavior for every address. No result certifies safety.

## Privacy review before store submission

No native networking, analytics, accounts, or scan-history persistence is implemented. Shared text and results stay in memory. Clipboard copying is explicit and requests a local-only item with a one-minute expiration. Safari stores only extension settings, while context-menu reports are transient worker-memory objects.

The included privacy manifests describe this implementation, not future additions. Independently re-check required-reason APIs, third-party additions, permission explanations, and App Store privacy answers before distribution. Physical-device Share/Safari permission behavior and battery use still require testing.
