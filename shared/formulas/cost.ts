/** Baukosten pro Stufe. `cost[i]` = `[timber, stone]` für Stufe i+1. */

export interface CostTable {
  readonly cost: ReadonlyArray<readonly [number, number]>;
}

export interface ResourceCost {
  timber: number;
  stone: number;
}

/** Kosten, um ein Gebäude auf `toLevel` (1-basiert) zu bauen/ausbauen. */
export function buildingCost(def: CostTable, toLevel: number): ResourceCost {
  const entry = def.cost[toLevel - 1];
  if (entry === undefined) {
    throw new RangeError(`Kein Kosten-Eintrag für Stufe ${toLevel}`);
  }
  return { timber: entry[0], stone: entry[1] };
}
