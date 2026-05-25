import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('verifiziert das korrekte Passwort', () => {
    expect(verifyPassword('geheim123', hashPassword('geheim123'))).toBe(true);
  });
  it('lehnt ein falsches Passwort ab', () => {
    expect(verifyPassword('falsch', hashPassword('geheim123'))).toBe(false);
  });
  it('speichert nicht den Klartext', () => {
    expect(hashPassword('geheim123')).not.toContain('geheim123');
  });
  it('erzeugt pro Aufruf einen anderen Hash (Salt)', () => {
    expect(hashPassword('x')).not.toBe(hashPassword('x'));
  });
  it('lehnt einen kaputten Hash-String ab', () => {
    expect(verifyPassword('x', 'kaputt')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
  });
});
