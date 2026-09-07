# SecondLook 1.2 — focused security review

**Scope:** the supplied Android companion, static web app, browser guard, and repository workflows.  
**Review date:** 7 September 2026.  
**Type:** implementation review and regression testing, **not an independent security audit or penetration test**.

AI-assisted development is not a security property by itself. What matters is the actual trust boundaries, data flows, permissions, dependencies, and evidence. This project must not be advertised as “unhackable”, as an antivirus, or as guaranteed scam detection.

## Changes made

### 1. Bounded, defensive native input handling

The earlier notification extractor could append a newline after reaching its input limit. It also converted framework-provided text to a full string before bounding it, and malformed notification/share extras were not uniformly contained.

- `SafeText` copies at most the allowed number of UTF-16 units without first calling an unbounded `toString()`.
- Joining message pieces reserves space for separators, so it cannot exceed the limit by one character.
- Invalid text and framework bundle types fail without crashing the listener or share screen.
- Native result errors avoid displaying arbitrary internal exception details.
- Permission/app-selection state is re-checked before posting a queued warning. Pausing clears outstanding app warning notifications.

Regression tests exercise large/custom character sequences, exact-limit joins, malformed notification types, malformed share payloads, and normal UI operation. They do not prove every possible Android framework payload is safe.

### 2. A non-debuggable distributable preview

The 1.1 download was a debug APK. The 1.2 `preview` variant inherits the release configuration with debugging disabled. Resource shrinking/minification reduces size; **obfuscation is not treated as a security boundary**.

The actual built APK is checked by `scripts/verify-android-apk.py` for:

- no `application-debuggable` flag;
- the expected separate preview package identity;
- only `POST_NOTIFICATIONS` as a requested runtime permission;
- a valid APK signature.

**Signing limitation:** this remains preview-signed, not an owner-controlled production signing release. The previous temporary 1.1 signing key was not retained. Version 1.2 uses `io.github.meyer4.secondlook.preview`, allowing comparison alongside the earlier app. Permissions/settings must be configured again; disable the older listener to avoid duplicate alerts. Establish owner-controlled signing before promising normal production update continuity.

### 3. Explicit privacy and permission boundaries retained

- No Android Internet, SMS-storage, contacts, accessibility, foreground-service, wake-lock, or sensitive-notification permission is added.
- Protection starts paused with no messaging apps selected.
- No message body or generated password is saved as app history or uploaded.
- Check screens retain `FLAG_SECURE`; generated clipboard items are marked sensitive, subject to OS behavior.
- Warning notifications contain generic reasons rather than the source message.
- The UI presents actual permission/selection/connection state, not an invented security score or “100% protected” counter.

### 4. Synthetic browser events cannot manufacture warning spam

The automatic link guard now requires a trusted user-activation event. Page-generated synthetic clicks cannot repeatedly create warning overlays and optional OS warnings through the guard.

This does **not** make scripted navigation safe or universally intercepted. Synthetic/script navigation remains explicitly outside coverage. The webpage still owns its DOM and may interfere with an overlay. This is a helper, not an unbypassable browser security boundary.

### 5. Client-side and hosting boundaries

The production website retains a restrictive CSP: local scripts/assets, no connection endpoints, no plugin objects, no form submissions, and no unsafe eval/inline script allowance. Referrer suppression is added to web/extension documents. User input continues to be rendered as text rather than HTML.

GitHub Pages does not let this repository set every HTTP security header, notably a server-enforced `frame-ancestors` policy. No unsupported header protection is claimed. The portable single-file preview intentionally needs inline script/style allowances and runs under the viewer sandbox; it is not the production hosting configuration.

### 6. Repository and supply-chain controls

- Third-party GitHub Actions are pinned to full commit SHAs, with readable version comments.
- The Pages test/package job has read permissions; Pages write/OIDC rights are limited to the deployment job.
- A CodeQL workflow is configured for JavaScript/TypeScript and Java, using security-extended queries. Java analysis uses no-build mode, so unresolved framework/dependency behavior remains a limitation. Check the workflow results for executed analysis—not merely this configuration file.
- Dependabot is configured to propose npm, GitHub Actions, and Gradle updates. Updates still need review and tests.
- Signing material and generated build directories are excluded from commits and downloadable source packages.

## Verification and remaining work

Local native/UI, web, and extension tests are recorded in `companions/VERIFICATION.md`. npm audit returned no known advisories in the installed npm dependency set during this review; that is **not** a claim of zero vulnerabilities in the application or all Android/Apple tooling.

Before wider or paid distribution:

1. Obtain independent review, including the notification listener and extension permissions.
2. Test real phones: lock states, permission revocation, notification grouping/redaction, DND, OEM process killing, repeated arrivals, and battery use.
3. Test Chrome/Edge and Safari consent prompts and page behavior with real users and assistive technology.
4. Establish owner-controlled signing and protect the GitHub account with passkeys/MFA. Do not commit keys or tokens.
5. Measure false positives and missed scams using ethical, de-identified test data. No accuracy figure is currently validated.
6. Review store policies, privacy forms, and platform restrictions before claiming store readiness.

A compromised device, malicious browser extension, changed hosting code, stolen signing key, or compromised repository can defeat a client-side tool. Clear disclosure and ongoing maintenance are part of security—not just code generation or a badge.
