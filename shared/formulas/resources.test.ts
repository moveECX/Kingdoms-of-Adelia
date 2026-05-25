import { describe, it, expect } from 'vitest';
import { deriveAmount, secondsUntilFull } from './resources';

describe('deriveAmount', () => {
  it('addiert Rate × Stunden', () => {
    expect(deriveAmount({ amount: 1000, ratePerH: 600, cap: 5000, elapsedMs: 3_600_000 })).toBe(1600);
  });
  it('deckelt bei cap', () => {
    expect(deriveAmount({ amount: 1000, ratePerH: 600, cap: 5000, elapsedMs: 36_000_000 })).toBe(5000);
  });
  it('rundet ab (ganzzahlig)', () => {
    expect(deriveAmount({ amount: 0, ratePerH: 100, cap: 9999, elapsedMs: 1_800_000 })).toBe(50);
  });
  it('keine negative Zeit', () => {
    expect(deriveAmount({ amount: 1000, ratePerH: 600, cap: 5000, elapsedMs: -5000 })).toBe(1000);
  });
});

describe('secondsUntilFull', () => {
  it('berechnet die Zeit bis zum vollen Lager', () => {
    expect(secondsUntilFull({ amount: 1000, ratePerH: 600, cap: 5000 })).toBeCloseTo((4000 / 600) * 3600);
  });
  it('null bei Rate 0 oder bereits voll', () => {
    expect(secondsUntilFull({ amount: 1000, ratePerH: 0, cap: 5000 })).toBeNull();
    expect(secondsUntilFull({ amount: 5000, ratePerH: 600, cap: 5000 })).toBeNull();
  });
});
