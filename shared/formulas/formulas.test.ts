import { describe, it, expect } from 'vitest';
import { adjacencyMultiplier, nodeBonusFraction, producerOutputPerH } from './adjacency';
import { buildingCost } from './cost';
import { buildTimeSec } from './buildtime';
import { baseProductionPerH } from './production';

const cfg = { nodeFirstPct: 50, nodeAdditionalPct: 40 } as const;

describe('adjacency', () => {
  it('Knotenanteil: erster +50%, jeder weitere +40%', () => {
    expect(nodeBonusFraction(0, cfg)).toBe(0);
    expect(nodeBonusFraction(1, cfg)).toBeCloseTo(0.5);
    expect(nodeBonusFraction(3, cfg)).toBeCloseTo(1.3);
  });

  it('verifiziertes Beispiel: L10-Woodcutter, 3 Knoten, 2×L10-Cottage, 1×L10-Sawmill → 1522,5/h', () => {
    const mult = adjacencyMultiplier({
      nodeCount: 3,
      cottageManpowerPcts: [30, 30],
      enhancerPct: 75,
      cfg,
    });
    expect(mult).toBeCloseTo(5.075);
    expect(producerOutputPerH(300, mult)).toBeCloseTo(1522.5);
  });

  it('nur ein Verstärker zählt (Aufrufer übergibt einen enhancerPct)', () => {
    const one = adjacencyMultiplier({ nodeCount: 1, cottageManpowerPcts: [], enhancerPct: 75, cfg });
    expect(one).toBeCloseTo((1 + 0.5) * 1.75);
  });

  it('daydull-Variante: Cottages separate multiplikative Gruppe → 1932/h', () => {
    const mult = adjacencyMultiplier({
      nodeCount: 3,
      cottageManpowerPcts: [30, 30],
      enhancerPct: 75,
      cfg: { ...cfg, model: 'separate_multiplicative' },
    });
    expect(producerOutputPerH(300, mult)).toBeCloseTo(1932);
  });
});

describe('cost', () => {
  // Hall-Kostentabelle (Auszug, [timber, stone]) aus GAME-MECHANICS.md §3.2
  const hall = {
    cost: [
      [0, 0],
      [200, 0],
      [500, 100],
      [1000, 300],
      [3000, 1500],
      [8000, 4000],
      [15000, 10000],
      [30000, 25000],
      [60000, 60000],
      [120000, 120000],
    ] as ReadonlyArray<readonly [number, number]>,
  };
  it('Hall L7 = 15000 Timber + 10000 Stone', () => {
    expect(buildingCost(hall, 7)).toEqual({ timber: 15000, stone: 10000 });
  });
  it('außerhalb des Bereichs wirft', () => {
    expect(() => buildingCost(hall, 11)).toThrow(RangeError);
  });
});

describe('buildTime', () => {
  const def = { buildTimeSec: [15, 54, 360, 2700, 6075, 12150, 22500, 35820, 53880, 81720] };
  it('Basiszeit bei 100%', () => {
    expect(buildTimeSec(def, 1, 100)).toBe(15);
    expect(buildTimeSec(def, 10, 100)).toBe(81720);
  });
  it('200% Bautempo halbiert die Zeit', () => {
    expect(buildTimeSec(def, 5, 200)).toBe(Math.round(6075 / 2));
  });
});

describe('production', () => {
  const woodcutter = { outputPerH: [20, 40, 60, 85, 110, 140, 175, 210, 250, 300] };
  it('Woodcutter L10 = 300/h', () => {
    expect(baseProductionPerH(woodcutter, 10)).toBe(300);
  });
});
