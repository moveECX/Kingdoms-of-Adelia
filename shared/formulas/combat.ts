/**
 * Kampfauflösung (GAME-MECHANICS.md §5, [verified]). Rein & deterministisch.
 *
 * 1. Angriffskraft a_tot = Σ(atk·qty).
 * 2. Verteidiger verteilen sich proportional zum Angriffsanteil a_i/a_tot;
 *    die Verteidigungsspalte richtet sich nach der Kategorie des Angreifers.
 * 3. d_i = (a_i/a_tot) · Σ(def_vs_kategorie · qty) · Wandfaktor; d_tot = Σ d_i.
 * 4. Angreifer gewinnt, wenn a_tot > d_tot.
 * 5. Verluste × Intensität I: Verlierer √(ratio)·I, Sieger ratio·I
 *    (Verteidiger einheitlich über ratio=a_tot/d_tot, Angreifer je Typ über d_i/a_i).
 */

export type DefenseCategory = 'infantry' | 'cavalry' | 'magic' | 'artillery';

export interface CombatUnit {
  attack: number;
  defense: Record<DefenseCategory, number>;
  /** Bestimmt, welche Verteidigungsspalte gegen diese (angreifende) Einheit zählt. */
  category: DefenseCategory;
}

/** Truppenstärke je Einheiten-Key. */
export type Force = Record<string, number>;

export interface CombatInput {
  attackers: Force;
  defenders: Force;
  stats: Record<string, CombatUnit>;
  /** Kampfintensität I (z. B. 0.5 Assault, 0.1 Belagerung, 0.01 Plünder-Verteidiger). */
  intensity: number;
  /** Multiplikator auf die Verteidigung (z. B. 1.5 bei City Wall L10); Default 1. */
  defenderDefenseMultiplier?: number;
  /** Multiplikator auf die Angriffskraft (z. B. 0.6 bei Nachtschutz); Default 1. */
  attackerAttackMultiplier?: number;
  /** Flacher Verteidigungs-Bonus je Angreifer-Kategorie (Türme verstärken passende Verteidiger). */
  towerDefenseBonus?: Partial<Record<DefenseCategory, number>>;
  /** Neutralisierbare Angreifer-Einheiten je Kategorie (Fallen; Effekt gedeckelt auf 50% des Typs). */
  trapNeutralized?: Partial<Record<DefenseCategory, number>>;
}

export interface CombatResult {
  attackerWins: boolean;
  attackPower: number;
  defensePower: number;
  attackerLosses: Force;
  defenderLosses: Force;
  attackerSurvivors: Force;
  defenderSurvivors: Force;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const CATEGORIES: readonly DefenseCategory[] = ['infantry', 'cavalry', 'magic', 'artillery'];

export function resolveCombat(input: CombatInput): CombatResult {
  const wallMult = input.defenderDefenseMultiplier ?? 1;
  const atkMult = input.attackerAttackMultiplier ?? 1;
  const intensity = input.intensity;
  const towerBonus = input.towerDefenseBonus ?? {};
  const trapCap = input.trapNeutralized ?? {};

  // Fallen: neutralisierter Anteil je Angreifer-Kategorie (max 50% des Typs).
  const qtyByCat: Record<DefenseCategory, number> = { infantry: 0, cavalry: 0, magic: 0, artillery: 0 };
  for (const [key, qty] of Object.entries(input.attackers)) {
    const s = input.stats[key];
    if (s === undefined || qty <= 0) continue;
    qtyByCat[s.category] += qty;
  }
  const neutralFrac: Record<DefenseCategory, number> = { infantry: 0, cavalry: 0, magic: 0, artillery: 0 };
  for (const cat of CATEGORIES) {
    const total = qtyByCat[cat];
    const cap = trapCap[cat] ?? 0;
    if (total > 0 && cap > 0) neutralFrac[cat] = Math.min(cap, 0.5 * total) / total;
  }

  // (1) Angriffskraft je Typ + gesamt (atkMult Nachtschutz; Fallen reduzieren passende Typen).
  const aPower = new Map<string, number>();
  let aTot = 0;
  for (const [key, qty] of Object.entries(input.attackers)) {
    const s = input.stats[key];
    if (s === undefined || qty <= 0) continue;
    const power = s.attack * qty * atkMult * (1 - neutralFrac[s.category]);
    aPower.set(key, power);
    aTot += power;
  }

  // (3a) Verteidigungssumme je Kategorie (+ Turm-Bonus).
  const defByCat: Record<DefenseCategory, number> = { infantry: 0, cavalry: 0, magic: 0, artillery: 0 };
  for (const [key, qty] of Object.entries(input.defenders)) {
    const s = input.stats[key];
    if (s === undefined || qty <= 0) continue;
    defByCat.infantry += s.defense.infantry * qty;
    defByCat.cavalry += s.defense.cavalry * qty;
    defByCat.magic += s.defense.magic * qty;
    defByCat.artillery += s.defense.artillery * qty;
  }
  for (const cat of CATEGORIES) defByCat[cat] += towerBonus[cat] ?? 0;

  // (3b) Verteidigungskraft je Angreifertyp + gesamt.
  const dPower = new Map<string, number>();
  let dTot = 0;
  for (const [key, power] of aPower) {
    const s = input.stats[key];
    if (s === undefined) continue;
    const fraction = aTot > 0 ? power / aTot : 0;
    const di = fraction * defByCat[s.category] * wallMult;
    dPower.set(key, di);
    dTot += di;
  }

  // (4) Sieger.
  const attackerWins = aTot > dTot;
  const ratio = dTot > 0 ? aTot / dTot : Number.POSITIVE_INFINITY;

  // (5) Verteidiger-Verluste (einheitlicher Prozentsatz).
  const defLossPct = clamp01(attackerWins ? Math.sqrt(ratio) * intensity : ratio * intensity);
  const defenderLosses: Force = {};
  const defenderSurvivors: Force = {};
  for (const [key, qty] of Object.entries(input.defenders)) {
    if (input.stats[key] === undefined || qty <= 0) continue;
    const lost = Math.floor(qty * defLossPct);
    defenderLosses[key] = lost;
    defenderSurvivors[key] = qty - lost;
  }

  // (5) Angreifer-Verluste (je Typ).
  const attackerLosses: Force = {};
  const attackerSurvivors: Force = {};
  for (const [key, qty] of Object.entries(input.attackers)) {
    const power = aPower.get(key);
    if (power === undefined || qty <= 0) continue;
    const di = dPower.get(key) ?? 0;
    const inv = power > 0 ? di / power : Number.POSITIVE_INFINITY;
    const lossPct = clamp01(attackerWins ? inv * intensity : Math.sqrt(inv) * intensity);
    const lost = Math.floor(qty * lossPct);
    attackerLosses[key] = lost;
    attackerSurvivors[key] = qty - lost;
  }

  return {
    attackerWins,
    attackPower: aTot,
    defensePower: dTot,
    attackerLosses,
    defenderLosses,
    attackerSurvivors,
    defenderSurvivors,
  };
}

const TYPE_TO_CATEGORY: Record<string, DefenseCategory> = {
  infantry: 'infantry',
  cavalry: 'cavalry',
  caster: 'magic',
  siege: 'artillery',
  naval: 'artillery',
  scout: 'infantry',
  special: 'infantry',
  epic: 'infantry',
};

/** Baut die Kampf-Stats aus den units.yaml-Definitionen (type → Kategorie). */
export function toCombatStats(
  units: Record<string, { attack: number; defense: Record<DefenseCategory, number>; type: string }>,
): Record<string, CombatUnit> {
  const out: Record<string, CombatUnit> = {};
  for (const [key, def] of Object.entries(units)) {
    out[key] = {
      attack: def.attack,
      defense: def.defense,
      category: TYPE_TO_CATEGORY[def.type] ?? 'infantry',
    };
  }
  return out;
}
