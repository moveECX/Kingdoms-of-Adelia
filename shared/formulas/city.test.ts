import { describe, it, expect } from 'vitest';
import { computeCityProduction, type PlacedBuilding } from './city';
import type { TileNode } from './terrain';
import type { BuildingDef } from '../schemas/data';

const defs: Record<string, BuildingDef> = {
  woodcutter_lodge: {
    name: "Woodcutter's Lodge",
    category: 'producer',
    maxLevel: 10,
    produces: 'timber',
    outputPerH: [20, 40, 60, 85, 110, 140, 175, 210, 250, 300],
  },
  farm: {
    name: 'Farm',
    category: 'producer',
    maxLevel: 10,
    produces: 'grain',
    outputPerH: [5, 8, 15, 20, 30, 45, 75, 120, 200, 300],
  },
  sawmill: {
    name: 'Sawmill',
    category: 'enhancer',
    maxLevel: 10,
    boosts: 'woodcutter_lodge',
    efficiencyPct: [30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
  },
  cottage: {
    name: 'Cottage',
    category: 'civic',
    maxLevel: 10,
    manpowerPct: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
    buildSpeedPct: [4, 10, 16, 25, 35, 46, 58, 71, 85, 100],
  },
};

const adjacency = { nodeFirstPct: 50, nodeAdditionalPct: 40, lakeForFarmPct: 50 };

describe('computeCityProduction', () => {
  it('L10-Woodcutter: 3 Holzknoten + 2 Cottages + 1 Sawmill → 1523/h, Bautempo 300%', () => {
    const tiles: TileNode[] = [
      { slotX: 0, slotY: 2, nodeType: 'wood' },
      { slotX: 2, slotY: 0, nodeType: 'wood' },
      { slotX: 2, slotY: 2, nodeType: 'wood' },
    ];
    const buildings: PlacedBuilding[] = [
      { slotX: 1, slotY: 1, buildingKey: 'woodcutter_lodge', level: 10 },
      { slotX: 0, slotY: 0, buildingKey: 'sawmill', level: 10 },
      { slotX: 0, slotY: 1, buildingKey: 'cottage', level: 10 },
      { slotX: 1, slotY: 0, buildingKey: 'cottage', level: 10 },
    ];
    const r = computeCityProduction({ tiles, buildings, buildingDefs: defs, adjacency });
    expect(r.ratePerH.timber).toBe(1523); // round(300 × 2.9 × 1.75)
    expect(r.constructionPct).toBe(300); // 100 + 2 × 100
    expect(r.slots).toHaveLength(1);
    expect(r.slots[0]).toMatchObject({ slotX: 1, slotY: 1, productionH: 1523, adjacencyPct: 408 });
  });

  it('Farm mit 2 Seen (ohne Abschwächung) → 600 Getreide/h', () => {
    const tiles: TileNode[] = [
      { slotX: 0, slotY: 0, nodeType: 'lake' },
      { slotX: 2, slotY: 2, nodeType: 'lake' },
    ];
    const buildings: PlacedBuilding[] = [{ slotX: 1, slotY: 1, buildingKey: 'farm', level: 10 }];
    const r = computeCityProduction({ tiles, buildings, buildingDefs: defs, adjacency });
    expect(r.ratePerH.grain).toBe(600); // round(300 × (1 + 2×0.5))
  });

  it('zweiter Sawmill am selben Produzenten zählt nicht doppelt', () => {
    const buildings: PlacedBuilding[] = [
      { slotX: 1, slotY: 1, buildingKey: 'woodcutter_lodge', level: 10 },
      { slotX: 0, slotY: 0, buildingKey: 'sawmill', level: 10 },
      { slotX: 2, slotY: 2, buildingKey: 'sawmill', level: 10 },
    ];
    const r = computeCityProduction({ tiles: [], buildings, buildingDefs: defs, adjacency });
    expect(r.ratePerH.timber).toBe(Math.round(300 * 1.75)); // nur ein Verstärker wirkt
  });
});
