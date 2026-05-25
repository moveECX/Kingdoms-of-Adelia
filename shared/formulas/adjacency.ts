/**
 * Adjazenz — die Signatur-Mechanik (verifiziertes Fandom-Modell):
 *   production = base × (1 + Σnodes + Σcottages) × (1 + enhancer)
 * Siehe GAME-MECHANICS.md §2. Die daydull-Variante (Cottages als separate
 * multiplikative Gruppe) ist über `cfg.model` umschaltbar (offener Konflikt #1,
 * RESEARCH-LOG.md) — kanonisch ist 'additive_then_enhancer'.
 */

export type AdjacencyModel = 'additive_then_enhancer' | 'separate_multiplicative';

export interface AdjacencyConfig {
  /** Bonus des ersten angrenzenden Knotens, in Prozent (LoU: 50). */
  nodeFirstPct: number;
  /** Bonus jedes weiteren Knotens, in Prozent (LoU: 40). */
  nodeAdditionalPct: number;
  /** Default: 'additive_then_enhancer'. */
  model?: AdjacencyModel;
}

/** Knotenanteil als Bruch: erster Knoten +50%, jeder weitere +40%. */
export function nodeBonusFraction(nodeCount: number, cfg: AdjacencyConfig): number {
  if (nodeCount <= 0) return 0;
  return (cfg.nodeFirstPct + (nodeCount - 1) * cfg.nodeAdditionalPct) / 100;
}

export interface AdjacencyInput {
  /** Anzahl angrenzender passender Ressourcen-Knoten. */
  nodeCount: number;
  /** Manpower-Bonus (in %) jeder angrenzenden Cottage, ihrer Stufe entsprechend. */
  cottageManpowerPcts: readonly number[];
  /** Efficiency-Bonus (in %) des einen angrenzenden Verstärkers; 0 wenn keiner (max. 1). */
  enhancerPct: number;
  cfg: AdjacencyConfig;
  /** Zusätzlicher Knoten-Bonus-Bruch ohne Abschwächung (z. B. Seen für Farms: +0.5 je See). */
  extraNodeFraction?: number;
}

/** Produktions-Multiplikator (×base). */
export function adjacencyMultiplier(input: AdjacencyInput): number {
  const nodes = nodeBonusFraction(input.nodeCount, input.cfg) + (input.extraNodeFraction ?? 0);
  const cottages = input.cottageManpowerPcts.reduce((sum, p) => sum + p / 100, 0);
  const enhancer = input.enhancerPct / 100;
  if (input.cfg.model === 'separate_multiplicative') {
    return (1 + nodes) * (1 + enhancer) * (1 + cottages);
  }
  return (1 + nodes + cottages) * (1 + enhancer);
}

/** Stündliche Produktion eines Produzenten aus Basiswert × Multiplikator. */
export function producerOutputPerH(baseOutputPerH: number, multiplier: number): number {
  return baseOutputPerH * multiplier;
}
