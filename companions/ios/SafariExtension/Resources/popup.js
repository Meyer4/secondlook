import { inspectLink, scanMessage, suggestedActions } from './core/scanner.js';
import { INCIDENTS } from './core/playbook.js';
const api = globalThis.browser || globalThis.chrome;
const isSafari = api.runtime.getManifest().name.includes('Safari');
const defaults = { enabled: false, sensitivity: 'balanced', browserWarnings: false };
const q = selector => document.querySelector(selector);
const node = (tag, text, className) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; };

// Appearance is a local display preference, never scan history.
let extensionDark = matchMedia('(prefers-color-scheme: dark)').matches;
try { const savedAppearance = await api.storage.local.get('appearance'); if (['light','dark'].includes(savedAppearance.appearance)) extensionDark = savedAppearance.appearance === 'dark'; } catch {}
function showExtensionTheme() {
  document.documentElement.dataset.theme = extensionDark ? 'dark' : 'light';
  const button = q('#extension-theme'); button.textContent = extensionDark ? 'Light' : 'Dark';
  button.setAttribute('aria-label',extensionDark ? 'Switch to light mode' : 'Switch to dark mode');
}
showExtensionTheme();
q('#extension-theme').addEventListener('click',async()=>{ extensionDark = !extensionDark; showExtensionTheme(); await api.storage.local.set({appearance:extensionDark ? 'dark':'light'}); });

let noticeTimer;
let activeOrigin = null;
try { const [tab] = await api.tabs.query({ active: true, currentWindow: true }); const url = new URL(tab.url); if (['http:','https:'].includes(url.protocol)) activeOrigin = url.origin; } catch {}
q('#allow-site').disabled = !activeOrigin;
function notice(text) { clearTimeout(noticeTimer); q('#notice').textContent = text; q('#notice').hidden = false; noticeTimer = setTimeout(() => { q('#notice').hidden = true; }, 6500); }
function changeTab(name) {
  ['guard','check','help'].forEach(id => { q('#' + id).hidden = id !== name; });
  document.querySelectorAll('[data-tab]').forEach(button => { const active = button.dataset.tab === name; button.classList.toggle('selected', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
}
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => changeTab(button.dataset.tab)));
async function refreshStatus() {
  const settings = await api.storage.local.get(defaults);
  q('#enabled').checked = settings.enabled; q('#sensitivity').value = settings.sensitivity; q('#browser-warnings').checked = settings.browserWarnings;
  const permissions = await api.permissions.getAll();
  const origins = (permissions.origins || []).filter(origin => /^https?:\/\//.test(origin));
  q('#status-dot').classList.toggle('active', settings.enabled && (isSafari || origins.length > 0));
  q('#status-text').textContent = !settings.enabled ? 'Protection is paused' : isSafari ? 'Enabled · Safari site permission required' : origins.length ? 'Enabled for approved websites' : 'Waiting for website permission';
  q('#access-status').textContent = isSafari ? 'Safari controls access per website. It cannot scan other apps or private notifications.' : origins.length ? 'Allowed patterns: ' + origins.join(', ') + '. Browser site-access settings can further restrict coverage.' : 'No persistent website access granted. Manual checks still work.';
}
async function connectCurrentPage() {
  if (isSafari || !api.scripting) return;
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url || '')) return;
  try { await api.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content.js'] }); }
  catch { notice('Reload approved pages to activate the guard. Some pages or frames cannot be protected.'); }
}
q('#enabled').addEventListener('change', async () => {
  await api.storage.local.set({ enabled: q('#enabled').checked });
  if (q('#enabled').checked) await connectCurrentPage();
  await refreshStatus();
});
q('#sensitivity').addEventListener('change', () => api.storage.local.set({ sensitivity: q('#sensitivity').value }));
async function allow(origins) {
  try {
    const granted = await api.permissions.request({ origins });
    if (!granted) { notice('Permission was not granted. You can still check links manually.'); return; }
    await api.storage.local.set({ enabled: true });
    await api.runtime.sendMessage({ type: 'refresh-sites' });
    await connectCurrentPage(); await refreshStatus();
    notice('Enabled on approved websites. Reload other open pages; not every kind of navigation can be intercepted.');
  } catch { notice('Open the browser’s extension site-access settings, then reload your page.'); }
}
q('#allow-all').addEventListener('click', () => allow(['http://*/*','https://*/*']));
q('#allow-site').addEventListener('click', () => {
  if (activeOrigin) allow([activeOrigin + '/*']);
  else notice('Open a normal HTTP or HTTPS website first. Browser settings pages cannot be protected.');
});
q('#browser-warnings').addEventListener('change', async () => {
  let enabled = q('#browser-warnings').checked;
  if (enabled) { try { enabled = await api.permissions.request({ permissions: ['notifications'] }); } catch { enabled = false; } }
  await api.storage.local.set({ browserWarnings: enabled }); q('#browser-warnings').checked = enabled;
  if (!enabled) notice('System notifications are off. On-page warnings can still work.');
});
if (isSafari) { q('#chrome-access').hidden = true; q('#safari-access').hidden = false; q('#notifications-option').hidden = true; }
function render(result) {
  changeTab('check'); q('#check-error').hidden = true;
  const card = node('div', undefined, 'card'); const summary = node('div', undefined, 'verdict ' + result.level);
  summary.append(node('strong', result.label), node('h2', result.title), node('p', result.description)); card.append(summary);
  if (result.hostname) card.append(node('code', result.hostname, 'host'));
  for (const signal of result.signals) { const reason = node('div', undefined, 'reason'); reason.append(node('h3', signal.title), node('p', signal.detail)); card.append(reason); }
  const next = node('div', undefined, 'reason'); next.append(node('h3', 'Next safe steps'));
  for (const step of suggestedActions(result)) next.append(node('p', step));
  card.append(next, node('p', 'No warning means only that the known patterns were not found. Links were not visited, redirected, or reputation-checked.', 'small'));
  q('#report').replaceChildren(card);
}
q('#analyse').addEventListener('click', () => {
  try { render(q('#kind').value === 'link' ? inspectLink(q('#input').value) : scanMessage(q('#input').value)); }
  catch (error) { q('#report').replaceChildren(); q('#check-error').textContent = error.message; q('#check-error').hidden = false; }
});
q('#input').addEventListener('input', () => { q('#report').replaceChildren(); q('#check-error').hidden = true; });
q('#kind').addEventListener('change', () => { q('#report').replaceChildren(); q('#check-error').hidden = true; q('#input').maxLength = q('#kind').value === 'link' ? 4096 : 12000; });
q('#clear').addEventListener('click', () => { q('#input').value = ''; q('#report').replaceChildren(); q('#check-error').hidden = true; });
for (const guide of INCIDENTS) {
  const details = node('details'); const list = node('ol'); guide.steps.forEach(step => list.append(node('li', step)));
  details.append(node('summary', guide.label), node('p', guide.intro), list); q('#guides').append(details);
}
const query = new URLSearchParams(location.search);
if (query.get('report')) {
  const result = await api.runtime.sendMessage({ type: 'take-report', id: query.get('report') });
  if (result) render(result); else { changeTab('check'); notice('That private report expired. Use Quick check or share the link again. Nothing was saved as history.'); }
}
if (query.has('expired')) { changeTab('check'); notice('That input could not be checked. Try a shorter text or a complete link.'); }
await refreshStatus();
