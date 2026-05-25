import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LEN = 64;
const SALT_LEN = 16;

/** Hasht ein Passwort mit scrypt (Node built-in) → `saltHex:hashHex`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** Prüft ein Passwort gegen einen gespeicherten `saltHex:hashHex`-String (timing-sicher). */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (saltHex === undefined || hashHex === undefined || hashHex.length === 0) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
