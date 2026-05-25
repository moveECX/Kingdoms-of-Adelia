/** Mappt Gebäude-Keys, Einheiten-Keys und Terrain auf Icon-Namen (siehe Icon.svelte). */

const BUILDING_ICON: Record<string, string> = {
  hall: 'hall',
  citadel: 'citadel',
  sanctuary: 'sanctuary',
  mage_tower: 'mage_tower',
  city_wall: 'wall',
  market: 'market',
  harbor: 'market',
  woodcutter_lodge: 'timber',
  sawmill: 'timber',
  quarry: 'stone',
  stonemason: 'stone',
  iron_mine: 'iron',
  foundry: 'iron',
  farm: 'grain',
  mill: 'grain',
  cottage: 'cottage',
  warehouse: 'storage',
  cellar: 'storage',
  townhouse: 'coin',
  watch_house: 'military',
  training_yard: 'military',
  barracks: 'military',
  stable: 'cavalry',
  siege_workshop: 'siege',
  shipyard: 'naval',
  ranger_tower: 'tower',
  guardian_tower: 'tower',
  templar_tower: 'tower',
  ballista_tower: 'tower',
  lookout_tower: 'tower',
  pitfall_trap: 'trap',
  barricade_trap: 'trap',
  arcane_trap: 'trap',
  camouflage_trap: 'trap',
};

const CATEGORY_ICON: Record<string, string> = {
  core: 'hall',
  producer: 'dot',
  enhancer: 'enhancer',
  civic: 'cottage',
  storage: 'storage',
  gold: 'coin',
  trade: 'market',
  military: 'military',
  defense: 'wall',
  special: 'citadel',
};

export function iconForBuilding(key: string, category?: string): string {
  return BUILDING_ICON[key] ?? (category === undefined ? 'dot' : (CATEGORY_ICON[category] ?? 'dot'));
}

const UNIT_ICON: Record<string, string> = {
  city_guard: 'military',
  berserker: 'infantry',
  ranger: 'infantry',
  guardian: 'infantry',
  crossbowman: 'infantry',
  templar: 'infantry',
  knight: 'cavalry',
  paladin: 'cavalry',
  scout: 'scout',
  mage: 'caster',
  warlock: 'caster',
  ram: 'siege',
  ballista: 'siege',
  catapult: 'siege',
  sloop: 'naval',
  frigate: 'naval',
  war_galleon: 'naval',
  marshal: 'marshal',
};

export function iconForUnit(key: string): string {
  return UNIT_ICON[key] ?? 'infantry';
}

const NODE_ICON: Record<string, string> = {
  wood: 'timber',
  stone: 'stone',
  iron: 'iron',
  grain: 'grain',
  lake: 'node-lake',
  empty: 'node-empty',
};

export function iconForNode(node: string): string {
  return NODE_ICON[node] ?? 'node-empty';
}

/** CSS-Farbvariable je Ressource/Knoten (für die Tönung). */
export const NODE_COLOR: Record<string, string> = {
  wood: 'var(--res-timber)',
  stone: 'var(--res-stone)',
  iron: 'var(--res-iron)',
  grain: 'var(--res-grain)',
  lake: 'var(--status-info)',
  empty: 'var(--text-muted)',
};
