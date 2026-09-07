import test from 'node:test';
import assert from 'node:assert/strict';
import { scanMessage, inspectLink, extractLinks, getVerdict, suggestedActions, MAX_MESSAGE_LENGTH, MAX_LINKS } from '../site/lib/scanner.js';

const has = (result, id) => result.signals.some(signal => signal.id.includes(id));

test('empty messages are rejected', () => {
  for (const value of ['', '   ', null, undefined, 123]) assert.throws(() => scanMessage(value), /Paste a message/);
});
test('message length limit is enforced, not silently truncated', () => {
  assert.throws(() => scanMessage('a'.repeat(MAX_MESSAGE_LENGTH + 1)), /under/);
  assert.equal(scanMessage('a'.repeat(MAX_MESSAGE_LENGTH)).characterCount, MAX_MESSAGE_LENGTH);
});
test('an ordinary message produces no safety guarantee', () => {
  const result = scanMessage('Hi! Are we still meeting at the library at 3? I’ll bring the notes from class.');
  assert.equal(result.level, 'unknown');
  assert.equal(result.signals.length, 0);
  assert.match(result.description, /does not mean .*safe/);
});
test('a request for an OTP is high concern', () => {
  const result = scanMessage('Please send me your OTP so I can fix your account.');
  assert.equal(result.level, 'high');
  assert.ok(has(result, 'security-code'));
});
test('PINs, passwords, recovery and seed phrases are treated as secrets', () => {
  for (const secret of ['PIN', 'password', 'recovery phrase', 'seed phrase', 'one-time code', 'verification code']) {
    assert.ok(has(scanMessage('Please share your ' + secret + ' with us.'), 'security-code'), secret);
  }
});
test('ordinary safety advice is not a request to share a secret', () => {
  for (const text of ['Never share your OTP with anyone.', 'Do not send your password to a stranger.', 'Don’t ever share your PIN.', 'You should not provide your recovery phrase.']) {
    assert.equal(has(scanMessage(text), 'security-code'), false, text);
  }
});
test('negated advice does not suppress a later real request', () => {
  const result = scanMessage('Never share your OTP with strangers. Please send your OTP to us.');
  assert.ok(has(result, 'security-code'));
});
test('an advance delivery fee is a warning pattern, not confirmed fraud', () => {
  const result = scanMessage('Your parcel is on hold. Pay a redelivery fee today or it will be returned. Update your card details at https://parcel-redelivery.example/pay');
  assert.equal(result.level, 'high');
  assert.ok(has(result, 'advance-fee'));
  assert.ok(has(result, 'card-details'));
  assert.match(result.description, /not proof/);
  assert.equal(result.links.length, 1);
});
test('wrong-transfer mobile money scam gets provider-specific next steps', () => {
  const result = scanMessage('Hi, I sent money to your mobile money account by mistake. Please send it back urgently to this different number. Don’t call customer care.');
  assert.ok(has(result, 'mistaken-deposit'));
  assert.ok(has(result, 'avoid-verification'));
  assert.equal(result.level, 'high');
  assert.match(suggestedActions(result).join(' '), /reversal/);
});
test('urgency by itself gets caution, not a certainty claim', () => {
  const result = scanMessage('Please reply immediately about the class schedule.');
  assert.equal(result.level, 'caution');
  assert.ok(has(result, 'urgency'));
});
test('gift card purchases in a payment request are flagged', () => {
  assert.ok(has(scanMessage('Please buy gift cards and send the codes.'), 'unusual-payment'));
  assert.equal(has(scanMessage('A gift card is in the envelope on the table.'), 'unusual-payment'), false);
});
test('guaranteed high investment returns are flagged', () => {
  assert.ok(has(scanMessage('Double your money with guaranteed profit.'), 'guaranteed-return'));
});
test('remote access requests get appropriate next steps', () => {
  const result = scanMessage('Install AnyDesk and give us remote access to fix your bank account.');
  assert.ok(has(result, 'remote-access'));
  assert.match(suggestedActions(result)[0], /remote control/);
});
test('new-number money request is noted', () => {
  assert.ok(has(scanMessage('This is my new number and I need money for transport.'), 'new-number'));
});
test('hidden directional characters are disclosed without declaring fraud', () => {
  const result = scanMessage('An ordinary sentence with a hidden \u202E character.');
  assert.ok(has(result, 'message-hidden-characters'));
});
test('messages without Latin-language text disclose limited coverage', () => {
  const result = scanMessage('请不要向陌生人发送您的验证码请不要向陌生人发送您的验证码请不要向陌生人发送您的验证码');
  assert.ok(has(result, 'language-limit'));
});
test('empty or malformed links give useful errors', () => {
  for (const value of ['', null, 'not a url', 'hello', 'https://']) assert.throws(() => inspectLink(value));
});
test('very long links are rejected', () => {
  assert.throws(() => inspectLink('https://example.com/' + 'a'.repeat(4096)), /shorter/);
});
test('HTTPS is not treated as proof of safety', () => {
  const result = inspectLink('https://www.wikipedia.org/wiki/Internet_safety');
  assert.equal(result.level, 'unknown');
  assert.equal(result.hostname, 'www.wikipedia.org');
  assert.match(result.description, /does not mean .*safe/);
});
test('schemeless links disclose that HTTPS was only assumed', () => {
  const result = inspectLink('example.com/path');
  assert.equal(result.assumedScheme, true);
  assert.equal(result.protocol, 'https:');
  assert.equal(result.hostname, 'example.com');
});
test('HTTP gets an encryption warning', () => {
  const result = inspectLink('http://example.com');
  assert.ok(has(result, 'unencrypted'));
  assert.equal(result.level, 'caution');
});
test('user information before @ cannot disguise the actual hostname', () => {
  const result = inspectLink('https://paypal.com@verify-wallet.example/login');
  assert.equal(result.hostname, 'verify-wallet.example');
  assert.ok(has(result, 'userinfo'));
  assert.equal(result.level, 'high');
});
test('userinfo passwords are never included in finding evidence', () => {
  const result = inspectLink('https://user:ultrasecret@example.com');
  assert.ok(result.signals.every(signal => !JSON.stringify(signal).includes('ultrasecret')));
});
test('Unicode hostnames are shown in browser-parsed punycode', () => {
  const result = inspectLink('https://аpple.com');
  assert.match(result.hostname, /^xn--/);
  assert.ok(has(result, 'international-domain'));
});
test('numeric, IPv6 and encoded numeric hosts are recognised', () => {
  for (const input of ['https://127.0.0.1', 'https://[::1]', 'https://2130706433', '127.0.0.1:3000']) {
    assert.ok(has(inspectLink(input), 'ip-host'), input);
  }
});
test('local addresses are explained without calling them fraudulent', () => {
  assert.ok(has(inspectLink('http://localhost:3000'), 'local-host'));
  assert.ok(has(inspectLink('https://printer.local'), 'local-host'));
});
test('a shortener is only an unknown final destination', () => {
  const result = inspectLink('https://bit.ly/example');
  assert.ok(has(result, 'shortener'));
  assert.equal(result.level, 'caution');
  assert.match(result.signals[0].detail, /not automatically scams/);
});
test('a genuine brand subdomain is not a brand mismatch', () => {
  assert.equal(has(inspectLink('https://support.google.com'), 'brand-google'), false);
  assert.equal(has(inspectLink('https://www.paypal.com'), 'brand-paypal'), false);
});
test('an apparent brand in an unrelated parent domain is flagged', () => {
  assert.ok(has(inspectLink('https://paypal.com.billing.example'), 'brand-paypal'));
  assert.ok(has(inspectLink('https://secure-paypal-login.example'), 'brand-paypal'));
});
test('brand-like substrings in unrelated words are not matched', () => {
  assert.equal(has(inspectLink('https://notpaypal.example'), 'brand-paypal'), false);
});
test('non-web schemes are never treated as ordinary destinations', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd', 'mailto:test@example.com']) {
    const result = inspectLink(url);
    assert.equal(result.level, 'high');
    assert.ok(has(result, 'non-web-scheme'));
  }
});
test('installer-like file paths are detected even with encoded extensions', () => {
  assert.ok(has(inspectLink('https://example.com/update.apk?source=text'), 'download'));
  assert.ok(has(inspectLink('https://example.com/update%2Eexe'), 'download'));
  assert.equal(has(inspectLink('https://example.com/apk-information'), 'download'), false);
});
test('nested destination parameters are explained, not followed', () => {
  assert.ok(has(inspectLink('https://example.com/login?next=https%3A%2F%2Fother.example%2F'), 'possible-redirect'));
});
test('ordinary emails are not extracted as clickable links', () => {
  assert.deepEqual(extractLinks('Please email alice@example.com for the notes.'), []);
});
test('full and bare links are extracted and deduplicated', () => {
  assert.deepEqual(extractLinks('See https://example.com/path, then www.example.org. Again https://example.com/path'), ['https://example.com/path', 'www.example.org']);
  assert.deepEqual(extractLinks('Visit example.com today.'), ['example.com']);
});
test('message links receive the same structural checks', () => {
  const result = scanMessage('Please look at https://paypal.com@wrong.example/account');
  assert.ok(has(result, 'userinfo'));
  assert.equal(result.links[0].hostname, 'wrong.example');
});
test('the number of inspected links is bounded and disclosed', () => {
  const text = Array.from({ length: MAX_LINKS + 2 }, (_, i) => 'https://a' + i + '.example').join(' ');
  const result = scanMessage(text);
  assert.equal(result.links.length, MAX_LINKS);
  assert.equal(result.linkCount, MAX_LINKS + 2);
  assert.ok(has(result, 'link-limit'));
});
test('markup is treated as text, never executed by the scanner', () => {
  const result = scanMessage('<img src=x onerror=alert(1)> Please send your OTP.');
  assert.ok(has(result, 'security-code'));
});
test('verdicts have no fake confidence scores or safe category', () => {
  for (const signals of [[], [{ severity: 'low' }], [{ severity: 'medium' }], [{ severity: 'high' }]]) {
    const verdict = getVerdict(signals);
    assert.equal(Object.hasOwn(verdict, 'score'), false);
    assert.notEqual(verdict.level, 'safe');
  }
});
test('IPv6 brackets and balanced URL parentheses survive extraction', () => {
  assert.deepEqual(extractLinks('Check https://[::1]'), ['https://[::1]']);
  assert.deepEqual(extractLinks('See (https://example.com/path).'), ['https://example.com/path']);
  assert.deepEqual(extractLinks('See https://example.com/wiki/Test_(example).'), ['https://example.com/wiki/Test_(example)']);
});
