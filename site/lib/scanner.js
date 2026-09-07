/* SecondLook: transparent, local pattern checks. No network requests. */
export const MAX_MESSAGE_LENGTH = 12000;
export const MAX_LINK_LENGTH = 4096;
export const MAX_LINKS = 10;

const SHORTENERS = new Set(['bit.ly', 't.co', 'tinyurl.com', 'tiny.cc', 'is.gd', 'buff.ly', 'ow.ly', 'cutt.ly', 'rb.gy', 'shorturl.at', 'rebrand.ly', 'lnkd.in', 'goo.gl']);
const BRAND_DOMAINS = [
  { name: 'PayPal', token: 'paypal', domains: ['paypal.com', 'paypal.me'] },
  { name: 'Google', token: 'google', domains: ['google.com', 'google.org', 'google.co.uk', 'google.co.in'] },
  { name: 'Microsoft', token: 'microsoft', domains: ['microsoft.com', 'microsoftonline.com', 'live.com'] },
  { name: 'Apple', token: 'apple', domains: ['apple.com', 'icloud.com'] },
  { name: 'Netflix', token: 'netflix', domains: ['netflix.com'] },
  { name: 'WhatsApp', token: 'whatsapp', domains: ['whatsapp.com', 'whatsapp.net'] },
  { name: 'Facebook', token: 'facebook', domains: ['facebook.com', 'fb.com'] },
  { name: 'Instagram', token: 'instagram', domains: ['instagram.com'] },
  { name: 'DHL', token: 'dhl', domains: ['dhl.com', 'dhl.de'] },
];

const MESSAGE_RULES = [
  {
    id: 'security-code', severity: 'high', skipNegated: true,
    pattern: /\b(?:send|share|tell|give|reply\s+with|forward|provide)\b[^.!?\n]{0,55}\b(?:otp|one[- ]time\s+(?:code|password|pin)|verification\s+code|security\s+code|login\s+code|password|pin|recovery\s+(?:code|phrase)|seed\s+phrase)\b/gi,
    title: 'A request for a secret',
    detail: 'A password, PIN, recovery phrase, or one-time code can give someone access to your account. Do not send it to another person. Use codes only in an official sign-in flow you started.',
  },
  {
    id: 'card-details', severity: 'medium', skipNegated: true,
    pattern: /\b(?:enter|update|confirm|send|share|provide|verify)\b[^.!?\n]{0,40}\b(?:card\s+(?:details|number)|credit\s+card|debit\s+card|bank\s+details|cvv)\b/gi,
    title: 'A request for financial details',
    detail: 'Requests to submit card or bank details deserve an independent check. Open the provider’s official app or type its known address yourself instead of following the message.',
  },
  {
    id: 'urgency', severity: 'medium', skipNegated: false,
    pattern: /\b(?:urgent(?:ly)?|act\s+now|immediately|last\s+chance|final\s+(?:warning|notice)|within\s+\d+\s+(?:minutes?|hours?)|account\s+(?:will\s+be\s+)?(?:suspended|locked|closed)|(?:pay|respond|reply|verify)[^.!?\n]{0,35}(?:or\s+(?:else|it\s+will)|today))\b/gi,
    title: 'Pressure to act quickly',
    detail: 'Urgency can stop you from checking the facts. A deadline alone does not prove a scam, but take time to verify a financial or account-related request independently.',
  },
  {
    id: 'advance-fee', severity: 'high', skipNegated: true,
    pattern: /\b(?:(?:pay|send|transfer)[^.!?\n]{0,45}(?:release\s+fee|processing\s+fee|redelivery\s+fee|delivery\s+fee|unlock\s+(?:your\s+)?(?:prize|funds|money))|(?:won|winner|prize|lottery|inheritance)[^.!?\n]{0,100}(?:fee|deposit|pay\b))\b/gi,
    title: 'A fee before you receive something',
    detail: 'Unexpected fees to release a prize, delivery, or funds are a common scam pattern. If you expect a parcel, check inside the delivery company’s official service—not through this message.',
  },
  {
    id: 'unusual-payment', severity: 'high', skipNegated: true,
    pattern: /\b(?:pay|send|buy|purchase|transfer)[^.!?\n]{0,50}\b(?:gift\s*cards?|voucher\s+codes?|bitcoin|crypto(?:currency)?|usdt)\b/gi,
    title: 'A hard-to-reverse payment request',
    detail: 'Scammers often ask for gift-card codes or cryptocurrency because recovery can be difficult. The payment method alone is not proof; independently verify who is asking and why.',
  },
  {
    id: 'guaranteed-return', severity: 'high', skipNegated: true,
    pattern: /\b(?:guaranteed\s+(?:profit|returns?|income)|risk[- ]free\s+(?:investment|profit)|double\s+your\s+(?:money|investment)|(?:earn|make|get)\s+\d+%\s+(?:daily|per\s+day|a\s+day))\b/gi,
    title: 'An unrealistic investment promise',
    detail: 'Guaranteed high returns and pressure to invest are major warning signs. Check any provider with your local financial regulator before sending money.',
  },
  {
    id: 'remote-access', severity: 'high', skipNegated: true,
    pattern: /\b(?:(?:install|download|open|use)[^.!?\n]{0,45}(?:anydesk|teamviewer|remote\s+(?:access|desktop)|support\s+app)|(?:allow|give|grant)[^.!?\n]{0,30}remote\s+access)\b/gi,
    title: 'A request to access your device',
    detail: 'Remote-access software can let another person control your device. Do not install or grant access because of an unexpected support message. Contact support through a channel you trust.',
  },
  {
    id: 'mistaken-deposit', severity: 'high', skipNegated: false,
    pattern: /\b(?:(?:sent|transferred|deposited)[^.!?\n]{0,85}(?:by\s+mistake|wrong\s+(?:number|account))|(?:refund|send\s+(?:it|the\s+money)\s+back)[^.!?\n]{0,45}(?:different|another|new)\s+(?:number|account))\b/gi,
    title: 'An unexpected “wrong transfer” story',
    detail: 'Do not send money back based on a message or screenshot. Check your balance in the official banking or mobile-money app, then ask the provider to handle any reversal.',
  },
  {
    id: 'avoid-verification', severity: 'high', skipNegated: false,
    pattern: /\b(?:don['’]?t|do\s+not|never)\s+(?:call|contact|tell)[^.!?\n]{0,40}\b(?:bank|customer\s+(?:care|service)|support|police|anyone|family)\b/gi,
    title: 'Pressure not to check with anyone',
    detail: 'Asking you to keep a money or account request secret can isolate you from help. Verify it with the real person or organisation using contact details you already trust.',
  },
  {
    id: 'new-number', severity: 'medium', skipNegated: false,
    pattern: /\b(?:new\s+(?:phone\s+)?number|lost\s+my\s+phone|phone\s+(?:is\s+)?broken)\b[^.!?\n]{0,100}\b(?:money|pay|transfer|send|help)\b/gi,
    title: 'A new identity paired with a money request',
    detail: 'Someone claiming to be a friend or relative on a new number may be impersonating them. Call the person on their previously saved number before sending anything.',
  },
];

function makeSignal(id, severity, title, detail, evidence = '') {
  return { id, severity, title, detail, evidence: String(evidence).slice(0, 180) };
}

function hostIs(hostname, expected) {
  return hostname === expected || hostname.endsWith('.' + expected);
}

function isNegatedAdvice(text, index) {
  const before = text.slice(Math.max(0, index - 80), index);
  return /\b(?:never|do\s+not|don['’]t|should\s+not|shouldn['’]t|will\s+not|won['’]t|avoid)\b[^,;.!?\n]{0,65}$/i.test(before);
}

export function getVerdict(signals) {
  const high = signals.some(signal => signal.severity === 'high');
  const mediumCount = signals.filter(signal => signal.severity === 'medium').length;
  if (high || mediumCount >= 3) {
    return {
      level: 'high', label: 'Strong warning signs', title: 'Pause before you act.',
      description: 'These patterns deserve caution. Do not click, pay, or share details until you have independently verified the request. This is not proof of a scam.',
    };
  }
  if (signals.length) {
    return {
      level: 'caution', label: 'Worth a closer look', title: 'Check a little further.',
      description: 'Some details need a second look. They can also appear in legitimate messages or links, so verify the context using a trusted channel.',
    };
  }
  return {
    level: 'unknown', label: 'No common warning signs found', title: 'Context still matters.',
    description: 'This check did not find the patterns it knows. That does not mean the message or link is safe. Verify unexpected requests before acting.',
  };
}

export function inspectLink(raw) {
  const input = typeof raw === 'string' ? raw.trim() : '';
  if (!input) throw new Error('Paste a link first. Nothing will be opened or visited.');
  if (input.length > MAX_LINK_LENGTH) throw new Error(`Use a link shorter than ${MAX_LINK_LENGTH.toLocaleString('en')} characters.`);
  if (/\s/.test(input)) throw new Error('Enter one link without spaces. Use Message check for a whole message.');
  const signals = [];
  const schemeMatch = input.match(/^([a-z][a-z\d+.-]*):/i);
  const hasScheme = Boolean(schemeMatch) && !/^[^/:]+:\d+(?:[/?#]|$)/.test(input);
  const assumedScheme = !hasScheme;
  let url;
  try { url = new URL(hasScheme ? input : 'https://' + input); }
  catch { throw new Error('That does not look like a valid link. Try a full address such as https://example.com.'); }

  if (!['http:', 'https:'].includes(url.protocol)) {
    signals.push(makeSignal('non-web-scheme', 'high', 'This is not a normal web link', 'This address uses ' + url.protocol + ' rather than HTTP or HTTPS. It may run an instruction or open another application. SecondLook will not open it.', url.protocol));
    return { kind: 'link', input, hostname: url.hostname || 'No website hostname', protocol: url.protocol, pathname: '', assumedScheme, signals, ...getVerdict(signals) };
  }
  if (!url.hostname) throw new Error('The link needs a website hostname, such as example.com.');
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname.includes('.') && !hostname.includes(':') && hostname !== 'localhost') {
    throw new Error('Use a complete website address, such as example.com. This tool checks public web links.');
  }
  if (url.protocol === 'http:') {
    signals.push(makeSignal('unencrypted', 'medium', 'An unencrypted connection', 'HTTP does not encrypt the connection. Avoid sending sensitive information. HTTPS is preferable, but HTTPS alone does not prove a site is trustworthy.', 'http://'));
  }
  if (url.username || url.password) {
    signals.push(makeSignal('userinfo', 'high', 'Text before @ can hide the destination', 'In a web address, text before @ is user information, not the website you will reach. The actual hostname here is ' + hostname + '.', 'Actual hostname: ' + hostname));
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[')) {
    signals.push(makeSignal('ip-host', 'medium', 'A numeric address instead of a domain', 'This link uses an IP address. That can be legitimate for a device or internal service, but it makes the organisation harder to identify. Verify it before entering information.', hostname));
  }
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    signals.push(makeSignal('local-host', 'low', 'A local-device address', 'This appears to point to a local device rather than an ordinary public website. Only use it if you know which service you are trying to access.', hostname));
  }
  if (hostname.split('.').some(label => label.startsWith('xn--'))) {
    signals.push(makeSignal('international-domain', 'low', 'An internationalised domain name', 'This domain contains non-ASCII characters, shown here in their encoded form. Many are legitimate. Similar-looking letters can also be misleading, so compare the exact hostname with a trusted source.', hostname));
  }
  if (/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/.test(input)) {
    signals.push(makeSignal('hidden-characters', 'medium', 'Invisible or directional characters', 'Hidden characters can change how an address looks. The browser-parsed hostname shown here is more useful than the visible text alone.', hostname));
  }
  if ([...SHORTENERS].some(shortener => hostIs(hostname, shortener))) {
    signals.push(makeSignal('shortener', 'low', 'The final destination is hidden', 'This is a known link-shortening service. Short links are not automatically scams, but this offline check cannot follow the redirect. Ask for the full original address or use the organisation’s official app.', hostname));
  }
  for (const brand of BRAND_DOMAINS) {
    const brandPattern = new RegExp('(^|[.-])' + brand.token + '([.-]|$)', 'i');
    if (brandPattern.test(hostname) && !brand.domains.some(domain => hostIs(hostname, domain))) {
      signals.push(makeSignal('brand-' + brand.token, 'medium', 'Brand wording outside a usual domain', `This hostname mentions ${brand.name}, but is not under the domains in our small ${brand.name} reference list. That list is not exhaustive. Open the service independently to check the request.`, hostname));
    }
  }
  let decodedPath = url.pathname;
  try { decodedPath = decodeURIComponent(url.pathname); } catch { /* Keep the original path if malformed. */ }
  if (/\.(?:exe|msi|apk|scr|bat|cmd|ps1|vbs|dmg|pkg)(?:$|\/)/i.test(decodedPath)) {
    signals.push(makeSignal('download', 'high', 'A link that looks like a software download', 'The address appears to name an installer or executable file. The content has not been downloaded or inspected. Install software only from a source you have independently verified.', decodedPath.slice(-120)));
  }
  for (const key of ['url', 'redirect', 'redirect_uri', 'redirect_url', 'next', 'continue', 'destination', 'target']) {
    const value = url.searchParams.get(key);
    if (value && /^https?:\/\//i.test(value)) {
      try {
        const destination = new URL(value).hostname;
        if (destination && destination.toLowerCase() !== hostname) {
          signals.push(makeSignal('possible-redirect', 'low', 'Another website appears inside the link', 'A URL parameter names a different website. It may be used for a redirect, but we cannot determine what the server will do without visiting it.', 'Embedded hostname: ' + destination));
          break;
        }
      } catch { /* Non-URL parameter values are ignored. */ }
    }
  }
  return { kind: 'link', input, hostname, protocol: url.protocol, pathname: url.pathname, assumedScheme, signals, ...getVerdict(signals) };
}

export function extractLinks(text) {
  const input = String(text);
  // Bound domain labels and anchor their start to avoid quadratic work on long,
  // unbroken strings. URL extraction is still heuristic, not a complete parser.
  const pattern = /(?:https?:\/\/|ftp:\/\/|javascript:|data:|file:\/\/|www\.)[^\s<>"`]+|\b(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}(?:[/:?#][^\s<>"`]*)?/gi;
  const unique = new Set();
  for (const match of input.matchAll(pattern)) {
    if (match.index > 0 && /[@\w]/.test(input[match.index - 1])) continue;
    let cleaned = match[0].replace(/[,.!?;:'"]+$/g, '');
    // Remove surrounding prose punctuation, but preserve balanced IPv6 brackets
    // and parentheses that really belong to a URL path.
    const pairs = { ')': '(', ']': '[', '}': '{' };
    for (let i = 0; i < 8; i++) {
      const closing = cleaned.at(-1);
      const opening = pairs[closing];
      if (!opening) break;
      const opens = [...cleaned].filter(character => character === opening).length;
      const closes = [...cleaned].filter(character => character === closing).length;
      if (closes <= opens) break;
      cleaned = cleaned.slice(0, -1);
    }
    if (cleaned) unique.add(cleaned);
  }
  return [...unique];
}

export function scanMessage(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) throw new Error('Paste a message first, or try one of the examples below.');
  if (text.length > MAX_MESSAGE_LENGTH) throw new Error(`Keep the message under ${MAX_MESSAGE_LENGTH.toLocaleString('en')} characters.`);
  const signals = [];
  for (const rule of MESSAGE_RULES) {
    const matches = text.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));
    for (const match of matches) {
      if (rule.skipNegated && isNegatedAdvice(text, match.index)) continue;
      signals.push(makeSignal(rule.id, rule.severity, rule.title, rule.detail, match[0]));
      break;
    }
  }
  if (/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/.test(text)) {
    signals.push(makeSignal('message-hidden-characters', 'low', 'Hidden formatting characters', 'The message contains invisible or directional characters. These can be legitimate in some languages, but can also disguise words or addresses. Check the exact sender and any destination.'));
  }
  const extracted = extractLinks(text);
  const links = extracted.slice(0, MAX_LINKS).map((link, index) => {
    try {
      const checked = inspectLink(link);
      for (const signal of checked.signals) signals.push({ ...signal, id: `link-${index}-${signal.id}` });
      return checked;
    } catch (error) {
      const signal = makeSignal(`link-${index}-unreadable`, 'low', 'A link could not be fully inspected', 'This text looks like a link, but could not be parsed. Ask for the full address, or check it separately in Link check.', link);
      signals.push(signal);
      return { input: link, hostname: 'Could not parse this address', signals: [signal], error: error.message };
    }
  });
  if (extracted.length > MAX_LINKS) {
    signals.push(makeSignal('link-limit', 'low', 'Not all links were inspected', `This message contains more than ${MAX_LINKS} distinct links. Only the first ${MAX_LINKS} were checked. Inspect the others separately.`));
  }
  if (text.length > 30 && !/[a-z]{3}/i.test(text)) {
    signals.push(makeSignal('language-limit', 'low', 'Limited language coverage', 'Message patterns currently focus on English. This message may need a trusted person who understands the language. Link structure checks still run.'));
  }
  return { kind: 'message', signals, links, linkCount: extracted.length, characterCount: text.length, ...getVerdict(signals) };
}

export function suggestedActions(result) {
  const ids = result.signals.map(signal => signal.id).join(' ');
  if (/mistaken-deposit/.test(ids)) return [
    'Check your real balance inside your banking or mobile-money app. A text or screenshot is not proof of a payment.',
    'Contact the provider through its official app or a number you already trust. Let the provider handle any reversal.',
    'Do not send money to a different number, or share your PIN or one-time code.',
  ];
  if (/security-code|card-details/.test(ids)) return [
    'Do not reply with a password, PIN, security code, recovery phrase, or card details.',
    'Open the service’s official app, or type its known website address yourself. Check for any genuine request there.',
    'If you already shared a secret, use “I need help now” to find the next steps.',
  ];
  if (/remote-access|download/.test(ids)) return [
    'Do not install the file or allow remote control because of this message.',
    'Contact the real support team through a trusted official channel.',
    'If you already installed something or granted access, use the help guide immediately.',
  ];
  return [
    'Verify unexpected requests using a saved phone number or the organisation’s official app—not contact details in the message.',
    'Avoid clicking, paying, or sharing sensitive details until the sender and request are confirmed.',
    'If it is suspicious, use the messaging platform’s report and block tools. Save evidence privately if money or an account is involved.',
  ];
}
