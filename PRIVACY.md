# Privacy at a glance

## What stays in memory

Pasted messages, entered links, check results, and generated passwords are held in the current page’s memory. SecondLook does not upload them, save a check history, or write them to cookies, `localStorage`, `sessionStorage`, or an app database.

The Clear button removes both message/link fields and the visible result. Closing the page ends the current app session, subject to browser session-restoration behaviour. This is not a promise of secure memory erasure.

## What is saved on your device

- **Checklist progress:** four true/false values under `secondlook:habits:v1` in `localStorage`. The playbook’s Reset checklist button removes this entry. If storage is blocked, the checklist works for the current page only.
- **Offline app assets:** the hosted version’s service worker stores the app’s HTML, JavaScript, CSS, local font, icons, and manifest in a scoped cache. These are public app files, not your check input.

There are no analytics, ads, trackers, account registrations, or third-party runtime scripts.

## What the web host can see

Like other websites, hosting the app involves ordinary requests for page and asset files. The hosting provider may log request metadata, such as IP address and user-agent information, under its own policy. SecondLook never adds check input or generated passwords to these requests.

Do not manually place private data in a website URL. The app uses only harmless hash navigation between its three views.

## Clipboard and your device

Paste reads the clipboard only after you press Paste and the browser permits it. Copy writes the selected output only after you press Copy.

Copied passwords and reports can appear in operating-system clipboard history or be visible to other software. Shared-device users should be especially careful. Browser extensions, malware, crash reporting, keyboard services, screenshots, and session restoration are outside SecondLook’s control.

## Sharing a report

The app’s copied report omits the original message, full URLs, and quoted matched evidence. It may include hostnames, warning titles, and explanatory details. Review any report before sharing it. Never publish real security codes, account details, private links, or personal documents.

## Changes

This policy describes the supplied version 1 implementation. If an owner adds a backend, analytics, user accounts, reputation APIs, error telemetry, or remote fonts, they must update the implementation and disclosures before claiming the same privacy behaviour.
