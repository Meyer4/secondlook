/* Bundled after the shared scanner inside an isolated IIFE. No network I/O. */
const ext = globalThis.browser || globalThis.chrome;
if (!ext?.runtime?.id || globalThis.__secondLookGuardInstalled) return;
globalThis.__secondLookGuardInstalled = true;
let guardSettings = { enabled: false, sensitivity: 'balanced', browserWarnings: false };
let dismissCurrent = null;
const bypass = new WeakSet();
const recentWarnings = new Map();

ext.storage.local.get(guardSettings).then(value => { guardSettings = value; }).catch(() => {});
ext.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const key of Object.keys(guardSettings)) if (changes[key]) guardSettings[key] = changes[key].newValue;
  if (!guardSettings.enabled && dismissCurrent) dismissCurrent();
});
function shouldInterrupt(result) {
  if (guardSettings.sensitivity === 'strong') return result.level === 'high';
  if (guardSettings.sensitivity === 'strict') return result.signals.length > 0;
  return result.signals.some(signal => signal.severity !== 'low');
}
function guardNode(tag, text) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
}
function warnBeforeNavigation(anchor, event, href, result) {
  if (dismissCurrent) dismissCurrent();
  const previousFocus = document.activeElement;
  const host = guardNode('div');
  host.setAttribute('data-secondlook-warning', '');
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = guardNode('style');
  style.textContent = `:host{all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;display:block!important}*{box-sizing:border-box}.veil{position:fixed;inset:0;background:#14261dc9;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#203028}.dialog{background:#fbfcf7;max-width:480px;width:100%;border:1px solid #dae6ce;border-radius:20px;padding:26px;box-shadow:0 20px 90px #0004;max-height:90vh;overflow:auto}.brand{font-size:12px;font-weight:750;letter-spacing:.04em;color:#587047;margin-bottom:14px}.badge{display:inline-block;font-size:10px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;color:#995328;background:#f7eadc;padding:5px 9px;border-radius:6px}h2{font-size:26px;line-height:1.2;letter-spacing:-.6px;margin:13px 0}p{font-size:13px;color:#5e6e55;margin:12px 0}code{display:block;overflow-wrap:anywhere;padding:12px;background:#ecf2e2;color:#3d542d;border-radius:8px;font-size:13px}ul{padding:0 0 0 20px;font-size:12px;color:#546448;margin:18px 0}li{padding:3px 0}.actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}button{font:inherit;font-size:13px;font-weight:700;border:1px solid #d7e2c9;padding:11px 16px;border-radius:8px;cursor:pointer;background:white;color:#35482a;min-height:44px}.back{background:#d9efa9;border-color:#d9efa9;flex:1}button:focus-visible{outline:3px solid #769955;outline-offset:3px}.note{font-size:11px;margin:15px 0 0;color:#617157}.note strong{color:#35482a}`;
  const veil = guardNode('div'); veil.className = 'veil';
  const dialog = guardNode('section'); dialog.className = 'dialog';
  dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'sl-warning-title'); dialog.tabIndex = -1;
  const brand = guardNode('div', '◉ SecondLook · On-device link check'); brand.className = 'brand';
  const badge = guardNode('span', result.label); badge.className = 'badge';
  const heading = guardNode('h2', 'Take a second look before you go.'); heading.id = 'sl-warning-title';
  const explanation = guardNode('p', 'We paused this link because its address matches a warning pattern. The site has not been visited by SecondLook.');
  const hostname = guardNode('code', result.hostname || 'Unrecognised address');
  const list = guardNode('ul'); result.signals.slice(0, 5).forEach(signal => list.append(guardNode('li', signal.title)));
  const actions = guardNode('div'); actions.className = 'actions';
  const stay = guardNode('button', 'Stay on this page'); stay.className = 'back'; stay.type = 'button';
  const proceed = guardNode('button', 'Continue anyway'); proceed.type = 'button';
  const note = guardNode('p', 'Not proof of fraud. No warning also does not mean “safe.” This guard cannot stop all navigation, redirects, scripts, forms, or activity inside other apps.'); note.className = 'note';
  actions.append(stay, proceed); dialog.append(brand, badge, heading, explanation, hostname, list, actions, note); veil.append(dialog); shadow.append(style, veil);
  (document.documentElement || document.body).append(host);
  const close = () => { host.remove(); dismissCurrent = null; try { previousFocus?.focus({ preventScroll: true }); } catch {} };
  dismissCurrent = close;
  stay.addEventListener('click', close);
  proceed.addEventListener('click', () => {
    // The user makes a fresh, explicit navigation decision. Never fetch the URL.
    const destination = guardNode('a'); destination.href = href;
    const newTab = event.ctrlKey || event.metaKey || event.button === 1 || anchor.target === '_blank';
    destination.target = newTab ? '_blank' : '_self'; destination.rel = 'noopener noreferrer';
    if (anchor.hasAttribute('download')) destination.setAttribute('download', anchor.getAttribute('download') || '');
    bypass.add(destination); destination.hidden = true; document.documentElement.append(destination);
    close(); destination.click(); destination.remove();
  });
  dialog.addEventListener('keydown', key => {
    if (key.key === 'Escape') { key.preventDefault(); key.stopPropagation(); close(); }
    if (key.key === 'Tab') {
      const focused = shadow.activeElement;
      if (key.shiftKey && (focused === stay || focused === dialog)) { key.preventDefault(); proceed.focus(); }
      else if (!key.shiftKey && focused === proceed) { key.preventDefault(); stay.focus(); }
    }
  });
  stay.focus({ preventScroll: true });
  const now = Date.now();
  const key = result.hostname + ':' + result.signals.map(signal => signal.id).join(',');
  if (!recentWarnings.has(key) || now - recentWarnings.get(key) > 60000) {
    recentWarnings.set(key, now);
    if (recentWarnings.size > 32) recentWarnings.delete(recentWarnings.keys().next().value);
    if (guardSettings.browserWarnings) ext.runtime.sendMessage({ type: 'local-warning', level: result.level }).catch(() => {});
  }
}
function inspectActivation(event) {
  // Restrict interruptions to real user activation. Synthetic page clicks
  // must not be able to repeatedly spawn warnings or OS notifications.
  if (!event.isTrusted || !guardSettings.enabled || event.defaultPrevented || ![0, 1].includes(event.button)) return;
  if (event.type === 'auxclick' && event.button !== 1) return;
  const anchor = event.composedPath().find(element => element instanceof HTMLAnchorElement || element instanceof HTMLAreaElement);
  if (!anchor || bypass.has(anchor) || !anchor.href) return;
  let parsed;
  try { parsed = new URL(anchor.href, document.baseURI); } catch { return; }
  if (!['https:', 'http:'].includes(parsed.protocol)) return;
  const here = new URL(location.href);
  if (parsed.origin === here.origin && parsed.pathname === here.pathname && parsed.search === here.search && parsed.hash) return;
  let result;
  try { result = inspectLink(parsed.href); }
  catch { result = { level: 'caution', label: 'This address could not be fully inspected', hostname: parsed.hostname, signals: [{ id: 'uninspected', severity: 'medium', title: 'A long or nonstandard address needs an independent check.' }] }; }
  if (!shouldInterrupt(result)) return;
  event.preventDefault(); event.stopImmediatePropagation();
  warnBeforeNavigation(anchor, event, parsed.href, result);
}
window.addEventListener('click', inspectActivation, true);
window.addEventListener('auxclick', inspectActivation, true);
