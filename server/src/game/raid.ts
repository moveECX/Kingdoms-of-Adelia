import type { Kysely, Selectable } from 'kysely';
import { resolveCombat, toCombatStats, type Force } from '@adelia/shared/formulas/combat';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database, MilitaryActionsTable } from '../db/types';
import { dungeonDefenders, lootCap, type DungeonType } from './dungeon';
import { TRAVEL_SEC_PER_TILE, chebyshev, totalCarry, sendBack } from './movement';

const RAID_INTENSITY = 0.5;

export class RaidError extends Error {}

export interface StartRaidParams {
  cityId: number;
  targetX: number;
  targetY: number;
  troops: Force;
}

/** Schickt Truppen aus der Garnison auf einen Dungeon-Raid (#P2-4). */
export async function startRaid(
  db: Kysely<Database>,
  params: StartRaidParams,
  now: Date = new Date(),
): Promise<{ actionId: number; resolveAt: Date }> {
  const troops = Object.entries(params.troops).filter(([, q]) => q > 0);
  if (troops.length === 0) throw new RaidError('Keine Truppen ausgewählt');

  const dungeon = await db
    .selectFrom('dungeons')
    .select(['id'])
    .where('x', '=', params.targetX)
    .where('y', '=', params.targetY)
    .executeTakeFirst();
  if (dungeon === undefined) throw new RaidError('Kein Dungeon am Zielort');

  const city = await db.selectFrom('cities').select(['x', 'y']).where('id', '=', params.cityId).executeTakeFirstOrThrow();

  for (const [unit, qty] of troops) {
    const g = await db
      .selectFrom('garrison')
      .select(['qty'])
      .where('city_id', '=', params.cityId)
      .where('unit_key', '=', unit)
      .executeTakeFirst();
    if ((g?.qty ?? 0) < qty) throw new RaidError(`Nicht genug ${unit} (${g?.qty ?? 0}/${qty})`);
  }
  for (const [unit, qty] of troops) {
    await db
      .updateTable('garrison')
      .set((eb) => ({ qty: eb('qty', '-', qty) }))
      .where('city_id', '=', params.cityId)
      .where('unit_key', '=', unit)
      .execute();
  }

  const travelSec = Math.max(1, chebyshev(city.x, city.y, params.targetX, params.targetY)) * TRAVEL_SEC_PER_TILE;
  const resolveAt = new Date(now.getTime() + travelSec * 1000);

  const action = await db
    .insertInto('military_actions')
    .values({
      kind: 'raid',
      origin_city: params.cityId,
      target_x: params.targetX,
      target_y: params.targetY,
      troops: JSON.stringify(params.troops),
      depart_at: now,
      resolve_at: resolveAt,
      phase: 'outbound',
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return { actionId: action.id, resolveAt };
}

/** Löst die Ankunft eines Dungeon-Raids auf: Kampf, Loot (durch Carry gedeckelt), Rückreise. */
export async function resolveRaidArrival(
  db: Kysely<Database>,
  gameData: GameData,
  action: Selectable<MilitaryActionsTable>,
): Promise<void> {
  const dungeon = await db
    .selectFrom('dungeons')
    .selectAll()
    .where('x', '=', action.target_x)
    .where('y', '=', action.target_y)
    .executeTakeFirst();
  // Dungeon verschwunden → Truppen kehren unverrichtet zurück.
  const troops = action.troops;
  if (dungeon === undefined) {
    await sendBack(db, action, troops, {});
    return;
  }

  const def = dungeonDefenders(dungeon.dungeon_type as DungeonType, dungeon.level);
  const stats = { ...toCombatStats(gameData.units.units), ...def.stats };
  const result = resolveCombat({ attackers: troops, defenders: def.force, stats, intensity: RAID_INTENSITY });

  const cargo: Record<string, number> = {};
  if (result.attackerWins) {
    const loot = Math.min(lootCap(dungeon.level), totalCarry(result.attackerSurvivors, gameData));
    const third = Math.floor(loot / 3);
    cargo.timber = third;
    cargo.stone = third;
    cargo.iron = loot - 2 * third;
    await db
      .updateTable('dungeons')
      .set({ completion: Math.min(100, dungeon.completion + 25) })
      .where('id', '=', dungeon.id)
      .execute();
  }

  await db
    .insertInto('combat_reports')
    .values({
      attacker_id: null,
      defender_id: null,
      target_x: action.target_x,
      target_y: action.target_y,
      detail: JSON.stringify({
        kind: 'raid',
        dungeon: { type: dungeon.dungeon_type, level: dungeon.level },
        attackerWins: result.attackerWins,
        attackPower: result.attackPower,
        defensePower: result.defensePower,
        attackerLosses: result.attackerLosses,
        loot: cargo,
      }),
    })
    .execute();

  const survivorTotal = Object.values(result.attackerSurvivors).reduce((s, q) => s + q, 0);
  if (survivorTotal > 0) {
    await sendBack(db, action, result.attackerSurvivors, cargo);
  } else {
    await db.deleteFrom('military_actions').where('id', '=', action.id).execute();
  }
}
