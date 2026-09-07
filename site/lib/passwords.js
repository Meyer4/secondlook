/* Cryptographic generation only: no Math.random, storage, or network. */
export const PASSWORD_GROUPS = Object.freeze({
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}:;,.?',
});

export function secureRandomIndex(upperBound, cryptoSource = globalThis.crypto) {
  if (!Number.isSafeInteger(upperBound) || upperBound < 1 || upperBound > 65536) throw new Error('Invalid random selection range.');
  if (!cryptoSource || typeof cryptoSource.getRandomValues !== 'function') throw new Error('Secure randomness is unavailable in this browser. Please use an updated browser over HTTPS.');
  const range = 0x100000000;
  const ceiling = Math.floor(range / upperBound) * upperBound;
  const buffer = new Uint32Array(1);
  for (let attempt = 0; attempt < 1000; attempt++) {
    cryptoSource.getRandomValues(buffer);
    if (buffer[0] < ceiling) return buffer[0] % upperBound;
  }
  throw new Error('Secure generation failed. Please try again in another browser.');
}

export function generatePassword({ length = 20, groups = ['lower', 'upper', 'numbers', 'symbols'], readable = false } = {}, cryptoSource = globalThis.crypto) {
  if (!Number.isSafeInteger(length) || length < 12 || length > 64) throw new Error('Choose a length between 12 and 64 characters.');
  if (!Array.isArray(groups) || groups.length < 1) throw new Error('Keep at least one character type selected.');
  const keys = [...new Set(groups)];
  if (keys.some(key => !Object.hasOwn(PASSWORD_GROUPS, key))) throw new Error('Unknown character type.');
  const alphabets = keys.map(key => readable ? PASSWORD_GROUPS[key].replace(/[Il1O0o|]/g, '') : PASSWORD_GROUPS[key]);
  const alphabet = alphabets.join('');
  // Rejection sampling avoids modulo bias. Reject full passwords missing a selected
  // character group, preserving a uniform distribution over valid passwords.
  for (let attempt = 0; attempt < 1000; attempt++) {
    let password = '';
    for (let i = 0; i < length; i++) password += alphabet[secureRandomIndex(alphabet.length, cryptoSource)];
    if (alphabets.every(group => [...password].some(character => group.includes(character)))) return password;
  }
  throw new Error('Could not meet the selected character rules. Please try again.');
}
