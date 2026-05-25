import { describe, it, expect } from 'vitest';
import { resolveCombat, toCombatStats, type CombatUnit } from './combat';

const stats: Record<string, CombatUnit> = {
  berserker: { attack: 50, category: 'infantry', defense: { infantry: 15, cavalry: 12, magic: 10, artillery: 15 } },
  knight: { attack: 90, category: 'cavalry', defense: { infantry: 40, cavalry: 30, magic: 20, artillery: 40 } },
  ranger: { attack: 30, category: 'infantry', defense: { infantry: 40, cavalry: 10, magic: 25, artillery: 15 } },
  guardian: { attack: 10, category: 'infantry', defense: { infantry: 30, cavalry: 50, magic: 20, artillery: 15 } },
};

describe('resolveCombat', () => {
  it('verifiziertes Wiki-Beispiel (Assault, I=0.5)', () => {
    const r = resolveCombat({
      attackers: { berserker: 1000, knight: 1000 },
      defenders: { ranger: 1400, guardian: 1400 },
      stats,
      intensity: 0.5,
    });
    expect(r.attackPower).toBe(140000);
    expect(r.defensePower).toBeCloseTo(89000, 0);
    expect(r.attackerWins).toBe(true);
    // Verteidiger verlieren √(140/89)·0.5 ≈ 62.71 %
    expect(r.defenderLosses.ranger).toBe(877);
    expect(r.defenderLosses.guardian).toBe(877);
    // Angreifer je Typ: Berserker 35 %, Knights 30 %
    expect(r.attackerLosses.berserker).toBe(350);
    expect(r.attackerLosses.knight).toBe(300);
    expect(r.attackerSurvivors.knight).toBe(700);
  });

  it('Verteidiger gewinnt: Angreifer wird ausgelöscht, Verteidiger kaum getroffen', () => {
    const r = resolveCombat({
      attackers: { berserker: 10 },
      defenders: { ranger: 1000 },
      stats,
      intensity: 0.5,
    });
    expect(r.attackerWins).toBe(false);
    expect(r.attackerLosses.berserker).toBe(10); // Verlust > 100 % → gedeckelt
    expect(r.defenderLosses.ranger).toBe(6);
  });

  it('City-Wall-Multiplikator erhöht die Verteidigung', () => {
    const base = resolveCombat({ attackers: { berserker: 1000 }, defenders: { ranger: 500 }, stats, intensity: 0.5 });
    const walled = resolveCombat({
      attackers: { berserker: 1000 },
      defenders: { ranger: 500 },
      stats,
      intensity: 0.5,
      defenderDefenseMultiplier: 2,
    });
    expect(walled.defensePower).toBeCloseTo(base.defensePower * 2);
    expect(walled.defenderLosses.ranger).toBeLessThan(base.defenderLosses.ranger ?? 0);
  });
});

describe('toCombatStats', () => {
  it('mappt type → Verteidigungskategorie', () => {
    const s = toCombatStats({
      mage: { attack: 70, type: 'caster', defense: { infantry: 15, cavalry: 10, magic: 30, artillery: 15 } },
      ram: { attack: 50, type: 'siege', defense: { infantry: 20, cavalry: 20, magic: 20, artillery: 50 } },
    });
    expect(s.mage?.category).toBe('magic');
    expect(s.ram?.category).toBe('artillery');
  });
});
