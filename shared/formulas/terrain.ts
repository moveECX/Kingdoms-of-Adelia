/**
 * Deterministischer Stadt-Terrain-Generator (#008). Gleicher Seed → gleiches
 * Layout. Erzeugt das 9×9-Knotenraster einer Stadt; das Zentrum ist für die
 * Hall reserviert. Knoten-Typen entsprechen city_tiles.node_type
 * (GAME-DATA-SCHEMA.md). Die LoU-genaue Knotenzahl aus dem Weltkarten-Terrain
 * folgt in Phase 2; hier eine plausible, seed-stabile Verteilung.
 */
import { CITY_GRID_SIZE } from '../constants/game';

export type NodeType = 'wood' | 'stone' | 'iron' | 'grain' | 'lake' | 'empty';

export interface TileNode {
  slotX: number;
  slotY: number;
  nodeType: NodeType;
}

/** Seeded PRNG (mulberry32) → deterministische Folge in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gewichtete Knoten-Verteilung (Summe = 1.0). */
const NODE_WEIGHTS: ReadonlyArray<readonly [NodeType, number]> = [
  ['empty', 0.52],
  ['wood', 0.12],
  ['stone', 0.12],
  ['iron', 0.09],
  ['grain', 0.09],
  ['lake', 0.06],
];

function pickWeighted(r: number, weights: ReadonlyArray<readonly [NodeType, number]>): NodeType {
  let acc = 0;
  for (const [type, weight] of weights) {
    acc += weight;
    if (r < acc) return type;
  }
  return weights[weights.length - 1]?.[0] ?? 'empty';
}

/** Index des Hall-Slots (Zentrum des Rasters). */
export const HALL_SLOT = Math.floor(CITY_GRID_SIZE / 2);

/** Erzeugt alle CITY_GRID_SIZE² Felder mit ihrem Knotentyp. */
export function generateCityTiles(seed: number): TileNode[] {
  const rng = mulberry32(seed);
  const tiles: TileNode[] = [];
  for (let y = 0; y < CITY_GRID_SIZE; y++) {
    for (let x = 0; x < CITY_GRID_SIZE; x++) {
      const isHall = x === HALL_SLOT && y === HALL_SLOT;
      tiles.push({ slotX: x, slotY: y, nodeType: isHall ? 'empty' : pickWeighted(rng(), NODE_WEIGHTS) });
    }
  }
  return tiles;
}
