import { inspectLink, scanMessage } from './core/scanner.js';
const api = globalThis.browser || globalThis.chrome;
const safari = api.runtime.getManifest().name.includes('Safari');
const defaults = { enabled: false, sensitivity: 'balanced', browserWarnings: false };
const transientReports = new Map();
let lastSystemWarning = 0;

async function registerApprovedSites() {
  if (safari || !api.scripting?.registerContentScripts) return;
  const permissions = await api.permissions.getAll();
  const matches = (permissions.origins || []).filter(origin => /^https?:\/\//.test(origin));
  const existing = await api.scripting.getRegisteredContentScripts({ ids: ['secondlook-guard'] });
  if (existing.length) await api.scripting.unregisterContentScripts({ ids: ['secondlook-guard'] });
  if (matches.length) await api.scripting.registerContentScripts([{ id: 'secondlook-guard', matches, js: ['content.js'], runAt: 'document_start', allFrames: true, persistAcrossSessions: true }]);
}
async function initialise() {
  const saved = await api.storage.local.get(defaults);
  await api.storage.local.set(saved);
  if (api.contextMenus) {
    await api.contextMenus.removeAll();
    api.contextMenus.create({ id: 'secondlook-link', title: 'Check this link with SecondLook', contexts: ['link'] });
    api.contextMenus.create({ id: 'secondlook-text', title: 'Check selected text with SecondLook', contexts: ['selection'] });
  }
  await registerApprovedSites();
}
api.runtime.onInstalled.addListener(() => initialise().catch(() => {}));
api.runtime.onStartup?.addListener(() => registerApprovedSites().catch(() => {}));
api.permissions?.onAdded?.addListener(() => registerApprovedSites().catch(() => {}));
api.permissions?.onRemoved?.addListener(() => {
  api.storage.local.set({ enabled: false }).catch(() => {});
  registerApprovedSites().catch(() => {});
});
function sanitiseResult(result) {
  return {
    kind: result.kind, level: result.level, label: result.label, title: result.title,
    description: result.description, hostname: result.hostname || '',
    signals: result.signals.map(signal => ({ id: signal.id, severity: signal.severity, title: signal.title, detail: signal.detail })),
  };
}
async function openTransientReport(result) {
  const now = Date.now();
  for (const [key, value] of transientReports) if (now - value.created > 120000) transientReports.delete(key);
  if (transientReports.size >= 16) transientReports.delete(transientReports.keys().next().value);
  const id = crypto.randomUUID();
  transientReports.set(id, { created: now, result: sanitiseResult(result) });
  await api.tabs.create({ url: api.runtime.getURL('popup.html') + '?report=' + encodeURIComponent(id) });
}
api.contextMenus?.onClicked?.addListener(info => {
  try {
    if (info.menuItemId === 'secondlook-link' && info.linkUrl) openTransientReport(inspectLink(info.linkUrl)).catch(() => {});
    if (info.menuItemId === 'secondlook-text' && info.selectionText) openTransientReport(scanMessage(info.selectionText.slice(0, 12000))).catch(() => {});
  } catch {
    api.tabs.create({ url: api.runtime.getURL('popup.html') + '?expired=1' }).catch(() => {});
  }
});
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || !message || typeof message.type !== 'string') return false;
  if (message.type === 'take-report') {
    const report = transientReports.get(message.id);
    transientReports.delete(message.id);
    respond(report && Date.now() - report.created < 120000 ? report.result : null);
    return false;
  }
  if (message.type === 'refresh-sites') {
    registerApprovedSites().then(() => respond({ ok: true })).catch(() => respond({ ok: false })); return true;
  }
  if (message.type === 'local-warning') {
    (async () => {
      const settings = await api.storage.local.get(defaults);
      if (!settings.enabled || !settings.browserWarnings || safari || !api.notifications || Date.now() - lastSystemWarning < 60000) return;
      if (!await api.permissions.contains({ permissions: ['notifications'] })) return;
      lastSystemWarning = Date.now();
      await api.notifications.create('secondlook-warning', { type: 'basic', iconUrl: api.runtime.getURL('icons/icon-128.png'), title: 'SecondLook paused a link', message: 'A link matched a warning pattern. Return to the page to review it. No page or message content is shown in this notification.' });
    })().then(() => respond({ ok: true })).catch(() => respond({ ok: false })); return true;
  }
  return false;
});
