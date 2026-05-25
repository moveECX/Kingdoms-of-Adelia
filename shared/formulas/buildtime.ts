/** Bauzeit pro Stufe, skaliert durch das Bautempo der Stadt. */

export interface BuildTimeTable {
  readonly buildTimeSec: readonly number[];
}

/**
 * Bauzeit in Sekunden für `toLevel` (1-basiert). `constructionPct` = 100 → ×1.0;
 * höher ist schneller (Cottages erhöhen es). 200 → halbe Zeit.
 */
export function buildTimeSec(def: BuildTimeTable, toLevel: number, constructionPct = 100): number {
  const base = def.buildTimeSec[toLevel - 1];
  if (base === undefined) {
    throw new RangeError(`Kein Bauzeit-Eintrag für Stufe ${toLevel}`);
  }
  if (constructionPct <= 0) {
    throw new RangeError('constructionPct muss > 0 sein');
  }
  return Math.round((base * 100) / constructionPct);
}
