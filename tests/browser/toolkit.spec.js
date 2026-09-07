import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function openApp(page) {
  await page.goto('/');
  await expect(page.locator('#example-buttons button')).toHaveCount(3);
}

test('loads with functional navigation and no browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openApp(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your digital life.');
  await page.locator('[data-nav="passwords"]').click();
  await expect(page).toHaveURL(/#passwords$/);
  await expect(page.locator('#generated-password')).not.toHaveValue('');
  await page.locator('[data-nav="playbook"]').click();
  await expect(page.locator('#incident-cards button')).toHaveCount(6);
  await expect(page.locator('[data-nav="playbook"]')).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

test('empty input is validated and an edited check cannot show stale results', async ({ page }) => {
  await openApp(page);
  await page.locator('#check-submit').click();
  await expect(page.locator('#check-error')).toContainText('Paste a message');
  await expect(page.locator('#message-input')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Delivery text', exact: false }).click();
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  await page.locator('#message-input').fill('A different message');
  await expect(page.locator('.verdict-label')).toHaveCount(0);
  await expect(page.locator('#result-state')).toContainText('Ready when you are');
  await expect(page.locator('#check-error')).toBeHidden();
  await page.locator('#clear-check').click();
  await expect(page.locator('#message-input')).toHaveValue('');
});

test('all message examples return appropriate non-certain explanations', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Mobile money', exact: false }).click();
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  await expect(page.locator('.next-steps')).toContainText('reversal');
  await page.getByRole('button', { name: 'Everyday message', exact: false }).click();
  await expect(page.locator('.verdict-label')).toHaveText('No common warning signs found');
  await expect(page.locator('.result-verdict')).toContainText('does not mean the message or link is safe');
});

test('link tabs support keyboard control and expose the actual hostname', async ({ page }) => {
  await openApp(page);
  await page.locator('#tab-message').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-link')).toBeFocused();
  await expect(page.locator('#tab-link')).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Hidden destination', exact: false }).click();
  await expect(page.locator('.hostname-card code')).toHaveText('verify-wallet.example');
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  await expect(page.locator('#results a')).toHaveCount(0);
  await page.getByRole('button', { name: 'Short link', exact: false }).click();
  await expect(page.locator('#results')).toContainText('cannot follow the redirect');
});

test('submitted messages and links trigger no requests and are not put in storage', async ({ page }) => {
  await openApp(page);
  await page.waitForLoadState('networkidle');
  const requests = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  const privateMarker = 'PRIVATE_TEST_MARKER_78234';
  await page.locator('#message-input').fill(privateMarker + ' Please send your OTP. https://never-visit-this.example/account');
  await page.locator('#check-submit').click();
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  expect(requests).toEqual([]);
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }));
  expect(storage).toEqual({ local: {}, session: {}, cookies: '' });
});

test('markup in a pasted message is rendered as text, not executable content', async ({ page }) => {
  await openApp(page);
  let dialogs = 0;
  page.on('dialog', async dialog => { dialogs++; await dialog.dismiss(); });
  await page.locator('#message-input').fill('Please send <img src=x onerror=alert(99)> your OTP.');
  await page.locator('#check-submit').click();
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  await expect(page.locator('#results img')).toHaveCount(0);
  await expect(page.locator('#results blockquote')).toContainText('<img');
  expect(dialogs).toBe(0);
});

test('copy summary omits the original message and URL query string', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openApp(page);
  await page.locator('#message-input').fill('PERSONAL_NOTE_8438 Please send your OTP. https://example.com/?private=PRIVATE_QUERY_334');
  await page.locator('#check-submit').click();
  await page.locator('.report-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('SECONDLOOK');
  expect(copied).not.toContain('PERSONAL_NOTE_8438');
  expect(copied).not.toContain('PRIVATE_QUERY_334');
  expect(copied).toContain('not a safety guarantee');
});

test('password generation follows controls and handles zero selected groups', async ({ page }) => {
  await page.goto('/#passwords');
  await expect(page.locator('#generated-password')).toHaveValue(/.{20}/);
  const first = await page.locator('#generated-password').inputValue();
  await page.locator('#generate-password').click();
  expect(await page.locator('#generated-password').inputValue()).not.toBe(first);
  await page.locator('#password-length').fill('32');
  expect((await page.locator('#generated-password').inputValue()).length).toBe(32);
  await page.locator('#readable-password').check();
  expect(await page.locator('#generated-password').inputValue()).not.toMatch(/[Il1O0o|]/);
  for (const input of await page.locator('input[name="character-group"]').all()) await input.uncheck();
  await expect(page.locator('#password-error')).toContainText('at least one');
  await expect(page.locator('#copy-password')).toBeDisabled();
  await expect(page.locator('#generated-password')).toHaveValue('');
  await page.locator('input[value="numbers"]').check();
  await expect(page.locator('#generated-password')).toHaveValue(/^[2-9]{32}$/);
});

test('clipboard failure has a usable manual-copy fallback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { get: () => undefined }));
  await page.goto('/#passwords');
  const password = await page.locator('#generated-password').inputValue();
  await page.locator('#copy-password').click();
  await expect(page.getByRole('dialog', { name: 'Copy manually' })).toBeVisible();
  await expect(page.locator('.copy-area')).toHaveValue(password);
  await page.keyboard.press('Escape');
  await expect(page.locator('.copy-area')).toHaveCount(0);
});

test('help provides incident-specific steps and closes with Escape', async ({ page }) => {
  await openApp(page);
  await page.locator('.help-button').click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.locator('[data-incident="paid"]').click();
  await expect(page.locator('#help-content')).toContainText('mobile-money');
  await expect(page.locator('#help-content')).toContainText('recovery is not guaranteed');
  await page.locator('[data-incident="code"]').click();
  await expect(page.locator('#help-content')).toContainText('expire does not undo');
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).not.toBeVisible();
  await expect(page.locator('.help-button')).toBeFocused();
});

test('only checklist progress persists, and reset removes it', async ({ page }) => {
  await page.goto('/#playbook');
  await page.locator('[data-habit="unique"]').check();
  await page.locator('[data-habit="mfa"]').check();
  await expect(page.locator('#habits-count')).toHaveText('2 of 4');
  await page.reload();
  await expect(page.locator('#habits-count')).toHaveText('2 of 4');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['secondlook:habits:v1']);
  await page.locator('#reset-habits').click();
  await expect(page.locator('#habits-count')).toHaveText('0 of 4');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('after installation, reload and core tools work offline', async ({ page, context }) => {
  await openApp(page);
  await expect(page.locator('#offline-status')).toHaveText('Offline-ready');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Mobile money', exact: false }).click();
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  await page.locator('[data-nav="passwords"]').click();
  await expect(page.locator('#generated-password')).toHaveValue(/.{20}/);
  await context.setOffline(false);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`all views fit a ${width}px-wide viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openApp(page);
    for (const view of ['check', 'passwords', 'playbook']) {
      await page.locator(`[data-nav="${view}"]`).click();
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect(dimensions.content, view).toBeLessThanOrEqual(dimensions.viewport);
    }
    await page.locator('[data-nav="check"]').click();
    await page.locator('#tab-link').click();
    await page.locator('#link-input').fill('https://' + 'a'.repeat(60) + '.' + 'b'.repeat(60) + '.example/path');
    await page.locator('#check-submit').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

for (const view of ['check', 'result', 'passwords', 'playbook', 'help', 'about']) {
  test(`automated accessibility checks pass in ${view}`, async ({ page }) => {
    await openApp(page);
    if (view === 'result') await page.getByRole('button', { name: 'Delivery text', exact: false }).click();
    if (view === 'passwords' || view === 'playbook') await page.locator(`[data-nav="${view}"]`).click();
    if (view === 'help') await page.locator('.help-button').click();
    if (view === 'about') await page.locator('.about-nav').click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('relative asset paths work under a GitHub Pages project subpath', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const loaded = [];
  await context.route('**/secondlook/**', async route => {
    const file = new URL(route.request().url()).pathname.replace('/secondlook/', '') || 'index.html';
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    try {
      const body = await readFile(new URL('../../site/' + file, import.meta.url));
      loaded.push(file);
      await route.fulfill({ status: 200, contentType: types[path.extname(file)] || 'text/plain', body });
    } catch { await route.fulfill({ status: 404, body: 'Not found' }); }
  });
  await page.goto('http://localhost:5173/secondlook/');
  await expect(page.locator('#example-buttons button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Delivery text', exact: false }).click();
  await expect(page.locator('.verdict-label')).toHaveText('Strong warning signs');
  expect(loaded).toContain('app.js');
  expect(loaded).toContain('lib/scanner.js');
  expect(loaded).toContain('styles.css');
  await context.close();
});

test('portable preview works in an offline sandbox without same-origin access', async ({ browser }, testInfo) => {
  const { execFileSync } = await import('node:child_process');
  const output = testInfo.outputPath('portable');
  execFileSync('python3', ['scripts/bundle.py', '--output-dir', output]);
  const html = await readFile(path.join(output, 'SecondLook-preview.html'), 'utf8');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await context.setOffline(true);
  await page.setContent('<iframe id="portable" sandbox="allow-scripts" style="width:100%;height:900px;border:0"></iframe>');
  await page.locator('#portable').evaluate((frame, content) => { frame.srcdoc = content; }, html);
  const frame = page.frameLocator('#portable');
  await expect(frame.locator('#example-buttons button')).toHaveCount(3);
  await frame.getByRole('button', { name: 'Mobile money', exact: false }).click();
  await expect(frame.locator('.verdict-label')).toHaveText('Strong warning signs');
  await frame.locator('[data-nav="passwords"]').click();
  await expect(frame.locator('#generated-password')).toHaveValue(/.{20}/);
  await frame.locator('[data-nav="playbook"]').click();
  await frame.locator('[data-habit="mfa"]').check();
  await expect(frame.locator('#habits-count')).toHaveText('1 of 4');
  expect(errors).toEqual([]);
  expect(requests.filter(url => !url.startsWith('data:'))).toEqual([]);
  await context.close();
});
