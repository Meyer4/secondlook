import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { generatePassword, secureRandomIndex, PASSWORD_GROUPS } from '../site/lib/passwords.js';

test('default password is 20 characters and includes all selected groups', () => {
  const password = generatePassword({}, webcrypto);
  assert.equal(password.length, 20);
  for (const alphabet of Object.values(PASSWORD_GROUPS)) assert.ok([...password].some(character => alphabet.includes(character)));
});
test('length choices are respected', () => {
  for (const length of [12, 16, 24, 40, 64]) assert.equal(generatePassword({ length }, webcrypto).length, length);
});
test('fresh generation produces distinct results', () => {
  const passwords = new Set(Array.from({ length: 100 }, () => generatePassword({}, webcrypto)));
  assert.equal(passwords.size, 100);
});
test('only selected character types are used', () => {
  assert.match(generatePassword({ groups: ['numbers'] }, webcrypto), /^\d{20}$/);
  assert.match(generatePassword({ groups: ['lower'] }, webcrypto), /^[a-z]{20}$/);
  assert.match(generatePassword({ groups: ['upper', 'lower'] }, webcrypto), /^[a-zA-Z]{20}$/);
});
test('readable mode excludes ambiguous characters', () => {
  for (let i = 0; i < 20; i++) assert.doesNotMatch(generatePassword({ length: 40, readable: true }, webcrypto), /[Il1O0o|]/);
});
test('no selected groups and unknown groups fail clearly', () => {
  assert.throws(() => generatePassword({ groups: [] }, webcrypto), /at least one/);
  assert.throws(() => generatePassword({ groups: ['unknown'] }, webcrypto), /Unknown/);
  assert.throws(() => generatePassword({ groups: ['__proto__'] }, webcrypto), /Unknown/);
  assert.throws(() => generatePassword({ groups: null }, webcrypto), /at least one/);
});
test('invalid lengths are rejected', () => {
  for (const length of [0, -1, 11, 65, 12.5, NaN, Infinity, '20']) assert.throws(() => generatePassword({ length }, webcrypto), /length/);
});
test('secure randomness is required, with no weak fallback', () => {
  assert.throws(() => generatePassword({}, {}), /Secure randomness/);
  assert.throws(() => secureRandomIndex(3, null), /Secure randomness/);
});
test('random selection rejects the biased tail of the integer range', () => {
  let calls = 0;
  const source = { getRandomValues(buffer) { buffer[0] = calls++ === 0 ? 0xffffffff : 4; return buffer; } };
  assert.equal(secureRandomIndex(3, source), 1);
  assert.equal(calls, 2);
});
test('selection bounds are checked', () => {
  for (const upper of [0, -2, 1.5, NaN, 65537]) assert.throws(() => secureRandomIndex(upper, webcrypto), /Invalid/);
});
test('a broken random source cannot hang indefinitely', () => {
  const source = { getRandomValues(buffer) { buffer[0] = 0xffffffff; return buffer; } };
  assert.throws(() => secureRandomIndex(3, source), /failed/);
});
test('duplicate character groups are safely deduplicated', () => {
  assert.match(generatePassword({ groups: ['numbers', 'numbers'] }, webcrypto), /^\d{20}$/);
});
