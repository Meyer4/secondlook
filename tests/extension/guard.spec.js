import { test, expect, chromium } from '@playwright/test';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function extension(testInfo, approved = true) {
  const dir = testInfo.outputPath('extension'); await mkdir(dir, { recursive: true }); await cp('companions/browser/extension', dir, { recursive: true });
  if (approved) {
    // Test-only manifest: pre-grant fixture host access because Chromium's native
    // consent popup is not driven by this suite. Production grants remain optional.
    const manifest = JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'));
    manifest.host_permissions = manifest.optional_host_permissions; delete manifest.optional_host_permissions;
    await writeFile(path.join(dir,'manifest.json'), JSON.stringify(manifest));
  }
  const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), { channel:'chromium', headless:true, viewport:{width:1280,height:900}, reducedMotion:'reduce', args:['--disable-extensions-except='+dir,'--load-extension='+dir] });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  await expect.poll(() => worker.evaluate(async()=>Object.keys(await chrome.storage.local.get(null)).length)).toBe(3);
  if (approved) await expect.poll(() => worker.evaluate(async()=>(await chrome.scripting.getRegisteredContentScripts()).length)).toBe(1);
  const id = new URL(worker.url()).host;
  return { context, worker, id };
}
const html = `<!doctype html><html lang="en"><head><title>Fictional link tests</title></head><body><h1>Fictional link tests</h1><a id="risk" href="https://paypal.com@wrong.example/account">Review your account</a><a id="ordinary" href="https://ordinary.example/next">Class notes</a><a id="short" href="https://bit.ly/example">Shortened link</a><button id="script" onclick="location.href='https://ordinary.example/scripted'">Scripted navigation</button></body></html>`;
async function fixture(context) {
  const page = await context.newPage(); const requests = [];
  page.on('request', request => requests.push(request.url()));
  await context.route('https://fixture.example/**', route => route.fulfill({ contentType:'text/html', body:html }));
  await context.route('https://ordinary.example/**', route => route.fulfill({ contentType:'text/html', body:'<h1>Ordinary fictional destination</h1>' }));
  await context.route(url => url.hostname === 'wrong.example', route => route.fulfill({ contentType:'text/html', body:'<h1>Fictional destination</h1>' }));
  await context.route('https://bit.ly/**', route => route.fulfill({ contentType:'text/html', body:'<h1>Fictional shortened destination</h1>' }));
  await page.goto('https://fixture.example/'); return { page, requests };
}

test('production manifest starts paused, without persistent website access', async ({}, testInfo) => {
  const {context,worker,id}=await extension(testInfo,false);
  expect(await worker.evaluate(()=>chrome.storage.local.get('enabled'))).toEqual({enabled:false});
  expect(await worker.evaluate(async()=>(await chrome.permissions.getAll()).origins || [])).toEqual([]);
  const page=await context.newPage();await page.goto(`chrome-extension://${id}/popup.html`);
  await expect(page.locator('#status-text')).toHaveText('Protection is paused');
  await context.close();
});
test('risky link is paused before any destination request, and Escape dismisses it', async ({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true}));
  const {page,requests}=await fixture(context);await page.locator('#risk').click();
  await expect(page.locator('[data-secondlook-warning]')).toHaveCount(1);expect(page.url()).toBe('https://fixture.example/');expect(requests).toEqual(['https://fixture.example/']);
  await page.keyboard.press('Escape');await expect(page.locator('[data-secondlook-warning]')).toHaveCount(0);await expect(page.locator('#risk')).toBeFocused();await context.close();
});
test('ordinary links preserve normal navigation without an interruption', async ({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true}));
  const {page}=await fixture(context);await page.locator('#ordinary').click();await expect(page).toHaveURL('https://ordinary.example/next');await expect(page.locator('[data-secondlook-warning]')).toHaveCount(0);await context.close();
});
test('pause changes affect existing pages without a reload', async ({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true}));
  const {page}=await fixture(context);await page.locator('#risk').click();await expect(page.locator('[data-secondlook-warning]')).toHaveCount(1);
  await worker.evaluate(()=>chrome.storage.local.set({enabled:false}));await expect(page.locator('[data-secondlook-warning]')).toHaveCount(0);
  await page.locator('#risk').click();await expect(page).toHaveURL(/wrong\.example\/account/);await context.close();
});
test('strict mode surfaces low-level shortener uncertainty without claiming fraud',async({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true,sensitivity:'strict'}));
  const {page,requests}=await fixture(context);await page.locator('#short').click();await expect(page.locator('[data-secondlook-warning]')).toHaveCount(1);expect(requests).toEqual(['https://fixture.example/']);await context.close();
});
test('manual message checks store no original text or check history',async({},testInfo)=>{
  const {context,worker,id}=await extension(testInfo);const page=await context.newPage();await page.goto(`chrome-extension://${id}/popup.html`);
  await page.locator('[data-tab="check"]').click();await page.locator('#kind').selectOption('message');await page.locator('#input').fill('PRIVATE_MARKER_7182 Please send your OTP.');await page.locator('#analyse').click();
  await expect(page.locator('#report')).toContainText('Strong warning signs');
  const stored=await worker.evaluate(()=>chrome.storage.local.get(null));expect(Object.keys(stored).sort()).toEqual(['browserWarnings','enabled','sensitivity']);expect(JSON.stringify(stored)).not.toContain('PRIVATE_MARKER');
  await page.locator('#input').fill('Changed');await expect(page.locator('#report')).toBeEmpty();await context.close();
});
test('the guard works offline on an already loaded approved page',async({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true}));
  const {page,requests}=await fixture(context);await context.setOffline(true);await page.locator('#risk').click();await expect(page.locator('[data-secondlook-warning]')).toHaveCount(1);expect(requests).toEqual(['https://fixture.example/']);await context.close();
});
test('scripted non-link navigation is explicitly outside the guard',async({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true}));
  const {page}=await fixture(context);await page.locator('#script').click();await expect(page).toHaveURL('https://ordinary.example/scripted');await context.close();
});

// Synthetic navigation is outside the guard; it cannot repeatedly manufacture
// warning overlays or system notifications without a user's real activation.
test('synthetic page clicks do not manufacture warning overlays',async({},testInfo)=>{
  const {context,worker}=await extension(testInfo);await worker.evaluate(()=>chrome.storage.local.set({enabled:true}));
  const {page}=await fixture(context);await page.locator('#risk').evaluate(anchor=>anchor.click());
  await expect(page).toHaveURL(/wrong\.example\/account/);
  await expect(page.locator('[data-secondlook-warning]')).toHaveCount(0);await context.close();
});
