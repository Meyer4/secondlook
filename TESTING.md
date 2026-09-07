# Verification record

**Date:** 7 September 2026  
**Environment:** Node.js 20.20.2; Playwright Chromium; local static server.

## Results

- **52 / 52 unit tests passed** (`npm test`).
- **25 / 25 browser tests passed** (`npm run test:browser`).
- No axe-core WCAG 2 A/AA or WCAG 2.1 AA violations were reported in the six tested desktop states: initial check, populated result, password maker, playbook, help dialog, and about dialog. This is not a complete accessibility certification.

## Behaviours verified

- Ordinary examples never receive a “safe” guarantee.
- Message rules, URL parsing, user-info `@` tricks, punycode, IP hosts, shorteners, installer-like paths, and parsing limits.
- Balanced IPv6 brackets and parentheses are retained during link extraction.
- Password length, selected character groups, readable mode, unbiased random selection, and failure when secure randomness is unavailable.
- Empty-input validation, keyboard-operated check tabs, navigation, and clearing stale results when input changes.
- User-controlled markup remains text rather than injected DOM content.
- Submitting a test message with a link causes no network requests and creates no cookies, local-storage entries, or session-storage entries.
- Shared summaries omit the test’s original message marker and private URL query marker.
- Clipboard failure has a manual-copy fallback.
- Incident guidance, dialog dismissal, and focus restoration.
- Only non-sensitive checklist booleans persist; reset removes them.
- A service-worker-controlled reload, message check, and password generation work with browser networking disabled.
- All three views and a long-hostname result fit widths of **320, 390, 768, 1024, and 1440 pixels** without horizontal page overflow.
- Module and asset paths work under a simulated `/secondlook/` GitHub Pages project path.
- The bundled standalone preview works in an **offline, opaque-origin iframe with `sandbox="allow-scripts"`**, including navigation, checks, password generation, and checklist behaviour when storage is unavailable.

## Not established by these tests

- Real-world scam detection accuracy, precision, recall, or complete language coverage.
- Whether any real message, website, sender, software download, or organisation is trustworthy.
- An independent security audit, penetration test, legal review, or professional incident-response endorsement.
- Full assistive-technology compatibility or browser coverage beyond the tested Chromium environment.
- A successful public GitHub Pages deployment. Public publication requires account authorization and a successful GitHub Actions run, followed by checking the deployed URL.

The tests use fictional or non-sensitive examples. No production credentials or victim messages are needed.
