/**
 * Stadt-Produktionsberechnung (#011) — wendet das Adjazenz-Modell auf die
 * tatsächliche Topologie an: für jeden Produzenten Knoten-Nachbarn, angrenzende
 * Cottages und einen (max. 1) Verstärker auswerten. Rein und deterministisch;
 * der Server cacht das Ergebnis (city_buildings.adjacency_pct/production_h,
 * cities.{res}_rate_h, cities.construction_pct) und rechnet nur bei
 * Layout-Änderung neu (ARCHITECTURE.md §4.3).
 */
import { adjacencyMultiplier, type AdjacencyConfig, type AdjacencyModel } from './adjacency';
import type { NodeType, TileNode } from './terrain';
import type { HarvestedResource } from '../constants/game';
import type { BuildingDef } from '../schemas/data';

export interface PlacedBuilding {
  slotX: number;
  slotY: number;
  buildingKey: string;
  level: number;
}

export interface SlotProduction {
  slotX: number;
  slotY: number;
  adjacencyPct: number;
  productionH: number;
}

export interface CityProductionResult {
  slots: SlotProduction[];
  ratePerH: Record<HarvestedResource, number>;
  constructionPct: number;
}

export interface CityProductionInput {
  tiles: readonly TileNode[];
  buildings: readonly PlacedBuilding[];
  buildingDefs: Readonly<Record<string, BuildingDef>>;
  adjacency: {
    nodeFirstPct: number;
    nodeAdditionalPct: number;
    lakeForFarmPct: number;
    model?: AdjacencyModel;
  };
}

const RESOURCE_NODE: Record<HarvestedResource, NodeType> = {
  timber: 'wood',
  stone: 'stone',
  iron: 'iron',
  grain: 'grain',
};

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];

const key = (x: number, y: number): string => `${x},${y}`;
const at = (arr: readonly number[] | undefined, level: number): number => arr?.[level - 1] ?? 0;

export function computeCityProduction(input: CityProductionInput): CityProductionResult {
  const tileByPos = new Map<string, NodeType>(input.tiles.map((t) => [key(t.slotX, t.slotY), t.nodeType]));
  const buildingByPos = new Map<string, PlacedBuilding>(input.buildings.map((b) => [key(b.slotX, b.slotY), b]));

  const cfg: AdjacencyConfig = {
    nodeFirstPct: input.adjacency.nodeFirstPct,
    nodeAdditionalPct: input.adjacency.nodeAdditionalPct,
    model: input.adjacency.model ?? 'additive_then_enhancer',
  };

  const ratePerH: Record<HarvestedResource, number> = { timber: 0, stone: 0, iron: 0, grain: 0 };
  const slots: SlotProduction[] = [];
  let constructionPct = 100;

  for (const b of input.buildings) {
    const def = input.buildingDefs[b.buildingKey];
    if (def === undefined) continue;

    // Stadtweites Bautempo: jede Cottage addiert ihren buildSpeedPct.
    if (def.buildSpeedPct !== undefined) {
      constructionPct += at(def.buildSpeedPct, b.level);
    }

    // Basis-Timber-Produktion (z. B. Hall, +300/h), flach, ohne Adjazenz.
    if (def.baseTimberPerH !== undefined) {
      ratePerH.timber += def.baseTimberPerH;
    }

    // Nur geerntete Produzenten erzeugen Ressourcen-Produktion.
    if (def.category !== 'producer' || def.produces === undefined || def.produces === 'gold') {
      continue;
    }
    const resource: HarvestedResource = def.produces;
    const matchNode = RESOURCE_NODE[resource];
    const base = at(def.outputPerH, b.level);

    let nodeCount = 0;
    let lakeCount = 0;
    const cottagePcts: number[] = [];
    let enhancerPct = 0;

    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const nKey = key(b.slotX + dx, b.slotY + dy);
      const node = tileByPos.get(nKey);
      if (node === matchNode) nodeCount++;
      else if (node === 'lake' && resource === 'grain') lakeCount++;

      const nb = buildingByPos.get(nKey);
      if (nb === undefined) continue;
      const nbDef = input.buildingDefs[nb.buildingKey];
      if (nbDef === undefined) continue;
      if (nbDef.manpowerPct !== undefined) {
        cottagePcts.push(at(nbDef.manpowerPct, nb.level));
      }
      if (nbDef.category === 'enhancer' && nbDef.boosts === b.buildingKey) {
        enhancerPct = Math.max(enhancerPct, at(nbDef.efficiencyPct, nb.level)); // max. 1 zählt
      }
    }

    const multiplier = adjacencyMultiplier({
      nodeCount,
      cottageManpowerPcts: cottagePcts,
      enhancerPct,
      cfg,
      extraNodeFraction: resource === 'grain' ? (lakeCount * input.adjacency.lakeForFarmPct) / 100 : 0,
    });
    const productionH = Math.round(base * multiplier);
    slots.push({
      slotX: b.slotX,
      slotY: b.slotY,
      adjacencyPct: Math.round((multiplier - 1) * 100),
      productionH,
    });
    ratePerH[resource] += productionH;
  }

  return { slots, ratePerH, constructionPct };
}
