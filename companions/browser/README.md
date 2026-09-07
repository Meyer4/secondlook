# Desktop link guard preview

## Load in Chrome or Edge

1. Run `npm run sync:companions` from the repository root, or extract the prepared browser ZIP.
2. Open `chrome://extensions` or `edge://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select `extension/` (or the extracted directory containing `manifest.json`).
4. Open SecondLook’s controls. Review and grant optional website access, then enable the guard.
5. Reload other open pages. Browser site-access settings may further restrict coverage.

This is a desktop development installation, **not a Chrome Web Store / Edge Add-ons listing**, and it is not the installation process for mobile Chrome.

## Behavior

The content script listens for supported HTTP/HTTPS link activation. It runs the shared address rules synchronously, without fetching the link. Medium/high findings interrupt normal link navigation in Balanced mode; Strict also interrupts low-level findings such as shorteners. The user can stay or explicitly continue.

Ordinary unflagged link events are not cancelled or replayed. No warning is a safety guarantee. Forms, script/location navigation, some context-menu paths, redirects, special/restricted pages, interfering page code/extensions, and links outside this browser are not universally covered.

Persistent host access and OS notifications are optional in the distributed manifest. Notification text is generic and rate-limited. The browser’s consent UI must be reviewed by the user; the test suite uses separate, pre-granted fixture permissions rather than pretending to approve that dialog.

No polling, DOM mutation observer, chat-history scan, remote API, message upload, or scan-history storage is implemented. Configuration alone is saved in extension local storage. Context-menu reports are brief, capped, consume-once in-memory objects that can expire when the event worker stops.

## Source maintenance

Edit `src/content-guard.js` and the shared `site/lib/scanner.js`, then run `npm run sync:companions`. `extension/content.js` is a generated, self-contained content-script bundle. This avoids runtime remote code or dynamic-import permissions.

```bash
npm ci
npx playwright install --with-deps chromium
npm run sync:companions
npm run test:extension
```

Safari uses the same source with a separate manifest and static, OS-permission-gated content-script registration. Its source/wrapper is under `../ios/`. Real Safari permission and device testing is still needed before claiming production readiness.
