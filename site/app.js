import { bootVisuals } from './visuals.js';
import { INCIDENTS } from './lib/playbook.js';
import { scanMessage, inspectLink, suggestedActions } from './lib/scanner.js';
import { generatePassword } from './lib/passwords.js';

const ICONS = {
  'scan': '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/><path d="M5 12s2.7-4 7-4 7 4 7 4-2.7 4-7 4-7-4-7-4Z"/><circle cx="12" cy="12" r="1.5"/>',
  'key': '<circle cx="8" cy="8" r="5"/><path d="m11.5 11.5 9 9m-3-3 3-3m-6 0 3-3"/><circle cx="7" cy="7" r=".6" fill="currentColor" stroke="none"/>',
  'book': '<path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15"/><path d="M6 8h3m6 0h3M6 12h3m6 0h3"/>',
  'message': '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H9l-6 2 2-6v-3.5A8.5 8.5 0 0 1 13.5 4 7.5 7.5 0 0 1 21 11.5Z"/><path d="M8 10h8m-8 4h5"/>',
  'link': '<path d="m10 13 4-4m-6 6-1.2 1.2a4 4 0 0 1-5.6-5.6l4-4a4 4 0 0 1 5.6 0m2.4 10.8a4 4 0 0 0 5.6 0l4-4a4 4 0 0 0-5.6-5.6L16 9" transform="translate(1 0) scale(.94)"/>',
  'shield-check': '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  'lock': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  'lifebuoy': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 3.6 3.6m5.6 5.6 3.6 3.6m0-12.8-3.6 3.6m-5.6 5.6-3.6 3.6"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/>',
  'alert': '<path d="m10.4 3.8-8 14a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3l-8-14a1.9 1.9 0 0 0-3.2 0Z"/><path d="M12 9v4m0 4h.01"/>',
  'check': '<path d="m5 12 4 4L19 6"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'clipboard': '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/>',
  'copy': '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/>',
  'rotate-ccw': '<path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6"/>',
  'refresh': '<path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6m-4 9a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/>',
  'sparkles': '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4M3 18v4m-2-2h4"/>',
  'hand': '<path d="M8 12V5a2 2 0 0 1 4 0v7m0-6a2 2 0 0 1 4 0v6m0-3a2 2 0 0 1 4 0v7c0 4-3 6-7 6-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-2l2 2"/>',
  'heart': '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  'globe': '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  'download': '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  'x': '<path d="m6 6 12 12M6 18 18 6"/>',
  'wallet': '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M17 6V3L4 6m17 6h-5v4h5m-3-2h.01"/>',
  'mouse': '<path d="m4 3 7 18 3-7 7-3L4 3Z"/>',
  'phone': '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/>',
  'user': '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
function node(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'text') element.textContent = String(value);
    else if (key === 'class') element.className = value;
    else element.setAttribute(key, String(value));
  }
  for (const child of children) element.append(child);
  return element;
}
function icon(name) {
  const element = node('i', { 'data-icon': name, 'aria-hidden': 'true' });
  fillIcon(element);
  return element;
}
function fillIcon(element) {
  // The SVG body comes exclusively from the fixed icon dictionary, never from input.
  element.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[element.dataset.icon] || ICONS.info) + '</svg>';
  element.setAttribute('aria-hidden', 'true');
}
$$('[data-icon]').forEach(fillIcon);

const EXAMPLES = {
  message: [
    { label: 'Delivery text', text: 'Your parcel is on hold. Pay a redelivery fee today or it will be returned. Update your card details at https://parcel-redelivery.example/pay' },
    { label: 'Mobile money', text: 'Hi, I sent money to your mobile money account by mistake. Please send it back urgently to this different number. Don’t call customer care.' },
    { label: 'Everyday message', text: 'Hi! Are we still meeting at the library at 3? I’ll bring the notes from class.' },
  ],
  link: [
    { label: 'Hidden destination', text: 'https://paypal.com@verify-wallet.example/login' },
    { label: 'Short link', text: 'https://bit.ly/example' },
    { label: 'Ordinary URL', text: 'https://www.wikipedia.org/wiki/Internet_safety' },
  ],
};



let currentMode = 'message';
let currentResult = null;
let currentView = '';
let toastTimeout;
const emptyResultNodes = [...$('#results-content').childNodes].map(child => child.cloneNode(true));

function showToast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 4800);
}

function resetResults() {
  currentResult = null;
  $('#results-content').replaceChildren(...emptyResultNodes.map(child => child.cloneNode(true)));
  $('#results').classList.remove('has-results');
  $('#result-state').replaceChildren(node('span', { class: 'small-dot' }), document.createTextNode('Ready when you are'));
  $('#scan-announcement').textContent = '';
}
function setCheckError(message = '') {
  $('#check-error').textContent = message;
  $('#check-error').hidden = !message;
  $('#message-input').removeAttribute('aria-invalid');
  $('#link-input').removeAttribute('aria-invalid');
  if (message) $('#' + currentMode + '-input').setAttribute('aria-invalid', 'true');
}
function updateCount() {
  $('#message-count').textContent = $('#message-input').value.length.toLocaleString('en') + ' / 12,000';
}
function renderExamples() {
  $('#example-buttons').replaceChildren(...EXAMPLES[currentMode].map(example => {
    const button = node('button', { type: 'button', class: 'example-button', title: 'Run a fictional example: ' + example.label }, [document.createTextNode(example.label), icon('arrow-up-right')]);
    button.addEventListener('click', () => {
      $('#' + currentMode + '-input').value = example.text;
      updateCount();
      runCheck();
    });
    return button;
  }));
}
function setMode(mode, focusTab = false) {
  if (!['message', 'link'].includes(mode)) return;
  currentMode = mode;
  $$('[data-mode]').forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('#panel-message').hidden = mode !== 'message';
  $('#panel-link').hidden = mode !== 'link';
  $('#check-submit-label').textContent = mode === 'message' ? 'Check this message' : 'Inspect this link';
  setCheckError();
  resetResults();
  renderExamples();
  if (focusTab) $('#tab-' + mode).focus();
}
$$('[data-mode]').forEach(tab => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const mode = event.key === 'Home' ? 'message' : event.key === 'End' ? 'link' : currentMode === 'message' ? 'link' : 'message';
      setMode(mode, true);
    }
  });
});

function hostnameCard(link) {
  const card = node('div', { class: 'hostname-card' }, [node('span', { text: 'ACTUAL HOSTNAME · NOT A CLICKABLE LINK' }), node('code', { text: link.hostname })]);
  let note = 'The website has not been visited. Its content and reputation are unknown.';
  if (link.error) note = 'This address could not be fully parsed. Inspect the original separately.';
  else if (link.assumedScheme) note = 'HTTPS was assumed for parsing only; this does not test the connection.';
  else if (link.protocol === 'https:') note = 'Uses HTTPS. Encryption does not prove that a website is trustworthy.';
  else if (!['http:', 'https:'].includes(link.protocol)) note = 'Non-web scheme: ' + link.protocol + ' SecondLook will not open it.';
  card.append(node('small', { text: note }));
  return card;
}
function signalCard(signal, index) {
  const details = node('details', { class: 'signal-card ' + signal.severity });
  if (index === 0) details.open = true;
  details.append(node('summary', {}, [icon(signal.severity === 'low' ? 'info' : 'alert'), node('h4', { text: signal.title }), icon('chevron-down')]));
  const body = node('div', { class: 'signal-body' }, [node('p', { text: signal.detail })]);
  if (signal.evidence) body.append(node('blockquote', { text: 'Matched: “' + signal.evidence + '”' }));
  details.append(body);
  return details;
}
function renderResult(result) {
  currentResult = result;
  $('#results').classList.add('has-results');
  $('#result-state').replaceChildren(node('span', { class: 'small-dot' }), document.createTextNode('Local check complete'));
  const content = $('#results-content');
  const verdict = node('div', { class: 'result-verdict ' + result.level }, [
    node('div', { class: 'verdict-label' }, [icon(result.level === 'unknown' ? 'info' : 'alert'), document.createTextNode(result.label)]),
    node('h3', { text: result.title }), node('p', { text: result.description }),
  ]);
  const count = result.signals.length;
  let countText = count === 1 ? '1 warning sign found' : count + ' warning signs found';
  if (result.kind === 'message') countText += ' · ' + (result.linkCount === 0 ? 'No links recognised' : result.linkCount + (result.linkCount === 1 ? ' link recognised' : ' links recognised'));
  verdict.append(node('div', { class: 'result-count', text: countText }));
  content.replaceChildren(verdict);
  if (result.kind === 'link') content.append(hostnameCard(result));
  if (result.kind === 'message' && result.links.length) {
    content.append(node('h3', { class: 'results-subheading', text: 'A closer look at the links' }));
    result.links.forEach(link => content.append(hostnameCard(link)));
  }
  if (count) {
    content.append(node('h3', { class: 'results-subheading', text: 'What stood out' }));
    result.signals.forEach((signal, index) => content.append(signalCard(signal, index)));
  }
  content.append(node('h3', { class: 'results-subheading', text: 'Your next safe steps' }));
  content.append(node('ol', { class: 'next-steps' }, suggestedActions(result).map(step => node('li', { text: step }))));
  const help = node('button', { type: 'button', class: 'result-help', 'data-help': '' }, [document.createTextNode('Already acted on it? Find the next step'), icon('arrow-right')]);
  content.append(help);
  const copy = node('button', { type: 'button', class: 'text-button report-copy' }, [icon('copy'), document.createTextNode('Copy a summary · without your original text')]);
  copy.addEventListener('click', () => copyText(makeSummary(result), 'Summary copied. Your original message was not included.'));
  content.append(copy);
  const aboutButton = node('button', { type: 'button', 'data-about': '', text: 'Understand the limits' });
  content.append(node('div', { class: 'result-disclaimer' }, [icon('info'), node('p', {}, [document.createTextNode('English-language patterns. No live reputation or content checks. No result guarantees safety. '), aboutButton])]));
  $('#scan-announcement').textContent = result.label + '. ' + countText + '. ' + result.title;
}
function runCheck() {
  setCheckError();
  try {
    const result = currentMode === 'message' ? scanMessage($('#message-input').value) : inspectLink($('#link-input').value);
    renderResult(result);
    $('#results').focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 650px)').matches) $('#results').scrollIntoView({ behavior: 'auto', block: 'start' });
  } catch (error) {
    resetResults();
    setCheckError(error.message || 'This input could not be checked. Please try again.');
    $('#' + currentMode + '-input').focus();
  }
}
$('#check-form').addEventListener('submit', event => { event.preventDefault(); runCheck(); });
['#message-input', '#link-input'].forEach(selector => {
  $(selector).addEventListener('input', () => { updateCount(); setCheckError(); if (currentResult) resetResults(); });
  $(selector).addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); runCheck(); }
  });
});
$('#clear-check').addEventListener('click', () => {
  $('#message-input').value = '';
  $('#link-input').value = '';
  updateCount(); setCheckError(); resetResults();
  $('#' + currentMode + '-input').focus();
  showToast('Check cleared. No check history is saved.');
});
$$('[data-paste]').forEach(button => button.addEventListener('click', async () => {
  const input = $('#' + currentMode + '-input');
  try {
    if (!navigator.clipboard?.readText) throw new Error('Clipboard unavailable');
    const text = await navigator.clipboard.readText();
    const limit = currentMode === 'message' ? 12000 : 4096;
    if (text.length > limit) {
      showToast('The clipboard is too long for this field. Paste a shorter excerpt manually.');
      input.focus();
      return;
    }
    input.value = text;
    updateCount(); setCheckError(); resetResults(); input.focus();
    if (!text) showToast('Your clipboard is empty. You can type or paste a message instead.');
  } catch { input.focus(); showToast('Clipboard access isn’t available here. Tap the field and paste manually.'); }
}));

function makeSummary(result) {
  const lines = ['SECONDLOOK — LOCAL PATTERN CHECK', '', result.label, result.description, ''];
  if (result.kind === 'link') lines.push('Hostname: ' + result.hostname, '');
  if (result.kind === 'message' && result.links.length) lines.push('Recognised hostnames: ' + result.links.map(link => link.hostname).join(', '), '');
  if (result.signals.length) lines.push('Warning signs:', ...result.signals.map(signal => '• ' + signal.title + ': ' + signal.detail), '');
  lines.push('Next steps:', ...suggestedActions(result).map((step, index) => `${index + 1}. ${step}`), '', 'This is not a safety guarantee or proof of a scam. English-language rules only; no live threat, content, or reputation checks. Original message and full URLs omitted.');
  return lines.join('\n');
}
async function copyText(text, successMessage) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const dialog = node('dialog', { class: 'modal copy-modal', 'aria-labelledby': 'copy-modal-title' });
    const close = node('button', { type: 'button', class: 'icon-button', 'aria-label': 'Close copy dialog' }, [icon('x')]);
    close.addEventListener('click', () => dialog.close());
    dialog.append(node('div', { class: 'modal-top' }, [node('h2', { id: 'copy-modal-title', text: 'Copy manually' }), close]));
    dialog.append(node('p', { class: 'modal-intro', text: 'Your browser blocked automatic copying. Select the text below and use Copy, or press Ctrl+C / Command+C.' }));
    const field = node('textarea', { class: 'copy-area', readonly: '', 'aria-label': 'Text to copy', spellcheck: 'false' });
    field.value = text;
    dialog.append(field);
    dialog.addEventListener('close', () => { field.value = ''; dialog.remove(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    document.body.append(dialog); dialog.showModal(); field.focus(); field.select();
  }
}

function updatePassword() {
  const groups = $$('input[name="character-group"]:checked').map(input => input.value);
  const length = Number($('#password-length').value);
  $('#password-length-output').textContent = String(length);
  $('#password-length-tag').textContent = length + ' characters';
  try {
    const password = generatePassword({ length, groups, readable: $('#readable-password').checked });
    $('#generated-password').value = password;
    $('#password-error').textContent = '';
    $('#password-error').hidden = true;
    $('#copy-password').disabled = false;
  } catch (error) {
    $('#generated-password').value = '';
    $('#password-error').textContent = error.message;
    $('#password-error').hidden = false;
    $('#copy-password').disabled = true;
  }
}
$('#generate-password').addEventListener('click', () => { updatePassword(); if ($('#generated-password').value) showToast('A fresh password, generated on your device.'); });
$('#password-length').addEventListener('input', updatePassword);
$$('input[name="character-group"]').forEach(input => input.addEventListener('change', updatePassword));
$('#readable-password').addEventListener('change', updatePassword);
$('#copy-password').addEventListener('click', () => {
  const value = $('#generated-password').value;
  if (value) copyText(value, 'Password copied. Save it in a password manager; be mindful of clipboard history.');
});
$('#generated-password').addEventListener('click', event => event.target.select());

function selectIncident(id) {
  const incident = INCIDENTS.find(item => item.id === id) || INCIDENTS[0];
  $$('#incident-options button').forEach(button => {
    const selected = button.dataset.incident === incident.id;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('#help-content').replaceChildren(node('h3', { text: incident.title }), node('p', { text: incident.intro }), node('ol', {}, incident.steps.map(step => node('li', { text: step }))));
}
function openHelp(id = 'clicked') {
  selectIncident(id);
  if (!$('#help-dialog').open) $('#help-dialog').showModal();
}
for (const incident of INCIDENTS) {
  const option = node('button', { type: 'button', class: 'incident-option', 'data-incident': incident.id, 'aria-pressed': 'false' }, [icon(incident.icon), document.createTextNode(incident.short)]);
  option.addEventListener('click', () => selectIncident(incident.id));
  $('#incident-options').append(option);
  const card = node('button', { type: 'button', class: 'incident-card', 'data-help': incident.id }, [node('span', { class: 'daily-icon ' + incident.tint }, [icon(incident.icon)]), icon('arrow-up-right'), node('h3', { text: incident.label }), node('p', { text: incident.description })]);
  $('#incident-cards').append(card);
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const internalLink = target.closest('a[href^="#"]');
  if (internalLink) {
    const destination = internalLink.getAttribute('href');
    if (['#check', '#passwords', '#playbook', '#main-content'].includes(destination)) {
      event.preventDefault();
      // A srcdoc preview has an opaque origin and may resolve fragment links
      // against its parent's URL. Keep portable previews entirely in-page.
      if (standalonePreview) route(false, destination.slice(1));
      else if (location.hash === destination) route(false, destination.slice(1));
      else location.hash = destination;
      return;
    }
  }
  const help = target.closest('[data-help]');
  if (help) openHelp(help.dataset.help || 'clicked');
  if (target.closest('[data-about]')) $('#about-dialog').showModal();
  const close = target.closest('[data-close]');
  if (close) document.getElementById(close.dataset.close)?.close();
});
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));

const HABIT_KEY = 'secondlook:habits:v1';
const habitInputs = $$('[data-habit]');
function loadHabits() {
  try {
    const saved = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const input of habitInputs) input.checked = Object.hasOwn(saved, input.dataset.habit) && saved[input.dataset.habit] === true;
    }
  } catch { /* Storage can be disabled. All core tools still work. */ }
  updateHabits();
}
function updateHabits() {
  const count = habitInputs.filter(input => input.checked).length;
  $('#habits-progress').value = count;
  $('#habits-count').textContent = count + ' of 4';
}
function saveHabits() {
  const data = Object.fromEntries(habitInputs.map(input => [input.dataset.habit, input.checked]));
  try { localStorage.setItem(HABIT_KEY, JSON.stringify(data)); }
  catch { showToast('This browser can’t save checklist progress. It will last only while this page is open.'); }
}
for (const input of habitInputs) input.addEventListener('change', () => { updateHabits(); saveHabits(); });
$('#reset-habits').addEventListener('click', () => {
  habitInputs.forEach(input => { input.checked = false; });
  updateHabits();
  try { localStorage.removeItem(HABIT_KEY); } catch { /* No persistent state in this context. */ }
  showToast('Checklist reset on this browser.');
});
loadHabits();

const VIEW_NAMES = { check: 'Safety check', passwords: 'Password maker', playbook: 'Safety playbook' };
function route(initial = false, requestedView) {
  let view = requestedView ?? location.hash.replace('#', '');
  if (view === 'main-content') { $('#main-content').focus(); return; }
  if (!Object.hasOwn(VIEW_NAMES, view)) view = 'check';
  if (view === currentView) return;
  $$('.view').forEach(section => { section.hidden = section.id !== 'view-' + view; });
  $$('[data-nav]').forEach(link => {
    const active = link.dataset.nav === view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  $('#breadcrumb-current').textContent = VIEW_NAMES[view];
  document.title = VIEW_NAMES[view] + ' — SecondLook';
  currentView = view;
  if (view === 'passwords' && !$('#generated-password').value) updatePassword();
  if (!initial) {
    const heading = $('#view-' + view + ' h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
window.addEventListener('hashchange', () => route());
renderExamples();
route(true);
selectIncident('clicked');
bootVisuals();

let deferredInstall;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); deferredInstall = event;
  $('#install-button').hidden = false;
});
$('#install-button').addEventListener('click', async () => {
  if (!deferredInstall) return;
  await deferredInstall.prompt();
  const outcome = await deferredInstall.userChoice;
  deferredInstall = null;
  $('#install-button').hidden = true;
  if (outcome.outcome === 'accepted') showToast('SecondLook is ready to keep close by.');
});
window.addEventListener('appinstalled', () => { $('#install-button').hidden = true; deferredInstall = null; });
const standalonePreview = document.documentElement.hasAttribute('data-standalone');
if (!standalonePreview && 'serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then(() => navigator.serviceWorker.ready)
    .then(() => { $('#offline-status').textContent = 'Offline-ready'; })
    .catch(() => { $('#offline-status').textContent = 'On-device checks'; });
}
