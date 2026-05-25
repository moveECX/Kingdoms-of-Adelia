/** Basis-Produktion (ohne Adjazenz) eines Produzenten je Stufe. */

export interface OutputTable {
  readonly outputPerH: readonly number[];
}

/** Stündliche Basis-Produktion bei `level` (1-basiert). */
export function baseProductionPerH(def: OutputTable, level: number): number {
  const value = def.outputPerH[level - 1];
  if (value === undefined) {
    throw new RangeError(`Kein Output-Eintrag für Stufe ${level}`);
  }
  return value;
}
