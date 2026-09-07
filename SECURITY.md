# Security model and limitations

## Purpose

SecondLook is an educational, local-first triage tool. It does not establish whether a person, message, link, organisation, or file is trustworthy. It must not be presented as professional incident-response advice, malware detection, or a security guarantee.

## Threats addressed by the implementation

- **Input disclosure to an analysis service:** there is no analysis service. The app sends no submitted text or URLs to a server.
- **Accidental navigation:** submitted URLs are non-clickable text, parsed without DNS lookups, HTTP requests, redirect following, or file downloads.
- **HTML/script injection:** user-controlled output is added with `textContent` or text nodes. `innerHTML` is used only for a fixed, internal SVG icon dictionary.
- **External client dependencies:** no CDN code, fonts, analytics, or runtime API dependencies. Fonts and assets are bundled locally.
- **Weak random passwords:** the library requires Web Crypto, uses rejection sampling to avoid modulo bias, and has no `Math.random` fallback. Generated candidates are rejected until each selected character class appears.
- **Unbounded input work:** messages are limited to 12,000 characters, links to 4,096, and embedded-link inspection to the first 10 distinct recognised links. Domain extraction bounds label length and uses word boundaries. These limits do not make all possible inputs semantically understandable.
- **Scope collisions in offline caches:** cache names include the service worker registration scope. Activation deletes only obsolete caches belonging to the same scope.

## What the pattern checks cannot do

- Verify identities, intentions, message origin, account activity, domain ownership, certificate validity, DNS, or website reputation.
- Inspect a live page, malware, a downloaded attachment, QR code, screenshot, audio, or image.
- Resolve redirects, link shorteners, display-text/href mismatches in formatted email, or every obfuscated URL.
- Reliably understand non-English messages, humour, quoted examples, negation, or broader context. Negation handling is intentionally narrow.
- Detect every lookalike domain or all uses of Unicode confusables. Internationalised domains are often legitimate.
- Infer safety from HTTPS, a familiar brand, an ordinary-looking link, or a lack of detected patterns.
- Use an exhaustive list of official brand domains or shorteners. Small lists provide context only and can become outdated.

There are **no validated precision/recall figures or calibrated probabilities**. Verdict levels are descriptive rule groupings. A high-warning result is not proof of fraud; an unflagged result is not a clean bill of health.

## Trust assumptions

The user must trust the device, browser, hosting origin, and delivered app code. A compromised host can replace a client-side app. This project cannot protect against malicious browser extensions, operating-system compromise, screenshots, clipboard history, browser autofill/session restoration, or someone viewing the screen.

“No storage” means this app does not intentionally persist check inputs or generated passwords. JavaScript strings are not guaranteed to be immediately zeroised from memory. Clearing a check does not securely wipe operating-system or browser memory.

The clipboard is only used after explicit Paste/Copy interaction. Copying a password places it in OS-managed clipboard state, which this app cannot guarantee to clear. The manual-copy dialog clears its field on close.

## Content Security Policy

`site/index.html` restricts assets and scripts to the app origin and sets `connect-src 'none'`, `object-src 'none'`, and `form-action 'none'`. It cannot set all HTTP security headers on GitHub Pages. The included development server adds `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer` without blocking the embedded development preview.

The generated standalone preview uses embedded scripts, CSS, icons, and a data-URI font; its policy permits those inline resources but forbids network connections. It is a portable preview, not an installable PWA. The deployed source version retains the stricter separate-file script policy.

## Reporting a vulnerability

Before sharing a public deployment widely, enable GitHub private vulnerability reporting in the repository’s security settings. Prefer a private report for a genuine exploitable vulnerability; do not post live credentials, victims’ messages, financial information, or weaponised examples publicly.

Reports about missed patterns or false positives should use **fictional or thoroughly de-identified text**, describe the expected behaviour, and acknowledge that no rule set can identify every scam.

## Maintenance

- Keep deployment actions and development dependencies current.
- Add regression tests for rule changes.
- Review local safety guidance and any domain reference lists periodically.
- Re-run browser and accessibility checks and verify additional browsers before a broad release.
- Never place an API key in client code. Optional remote reputation features would need an explicit consent flow and a revised threat model.
