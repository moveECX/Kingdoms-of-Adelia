import type { Kysely } from 'kysely';
import type { CombatUnit, Force } from '@adelia/shared/formulas/combat';
import type { Database } from '../db/types';

export type DungeonType = 'forest' | 'hill' | 'mountain' | 'sea';

interface MonsterTemplate {
  key: string;
  unit: CombatUnit;
}

// Ein Wächter-Monster je Dungeon-Typ. Stats [approximate] — Balancing folgt im Playtest.
const MONSTERS: Record<DungeonType, MonsterTemplate> = {
  forest: { key: 'spider', unit: { attack: 18, category: 'infantry', defense: { infantry: 35, cavalry: 25, magic: 20, artillery: 25 } } },
  hill: { key: 'skeleton', unit: { attack: 22, category: 'infantry', defense: { infantry: 30, cavalry: 35, magic: 20, artillery: 25 } } },
  mountain: { key: 'orc', unit: { attack: 26, category: 'infantry', defense: { infantry: 40, cavalry: 30, magic: 25, artillery: 30 } } },
  sea: { key: 'pirate', unit: { attack: 30, category: 'artillery', defense: { infantry: 30, cavalry: 30, magic: 25, artillery: 40 } } },
};

// Loot-Obergrenze je Dungeon-Level (GAME-MECHANICS.md §7, [verified]).
const LOOT_CAP = [320, 977, 2000, 15488, 30000, 56850, 117175, 198205, 356970, 441375];

/** Verteidiger-Force + Combat-Stats eines Dungeons (Monsterzahl skaliert mit Level). */
export function dungeonDefenders(type: DungeonType, level: number): { force: Force; stats: Record<string, CombatUnit> } {
  const monster = MONSTERS[type];
  return { force: { [monster.key]: level * 10 }, stats: { [monster.key]: monster.unit } };
}

/** Maximale Beute eines Dungeons dieses Levels. */
export function lootCap(level: number): number {
  return LOOT_CAP[level - 1] ?? LOOT_CAP[LOOT_CAP.length - 1] ?? 0;
}

const SPOTS: ReadonlyArray<{ dx: number; dy: number; level: number; type: DungeonType }> = [
  { dx: 2, dy: 0, level: 1, type: 'forest' },
  { dx: -2, dy: 1, level: 1, type: 'hill' },
  { dx: 1, dy: 3, level: 2, type: 'mountain' },
  { dx: -3, dy: -2, level: 3, type: 'sea' },
  { dx: 3, dy: -3, level: 2, type: 'forest' },
];

/** Legt einige Dungeons rund um eine Position an (Dev/Seed). */
export async function spawnDungeons(db: Kysely<Database>, around: { x: number; y: number }): Promise<void> {
  for (const s of SPOTS) {
    await db
      .insertInto('dungeons')
      .values({ x: around.x + s.dx, y: around.y + s.dy, dungeon_type: s.type, level: s.level })
      .onConflict((oc) => oc.columns(['x', 'y']).doNothing())
      .execute();
  }
}
