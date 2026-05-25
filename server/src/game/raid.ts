import type { Kysely, Selectable } from 'kysely';
import { resolveCombat, toCombatStats, type Force } from '@adelia/shared/formulas/combat';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database, MilitaryActionsTable } from '../db/types';
import { dungeonDefenders, lootCap, type DungeonType } from './dungeon';
import { materializeResources } from './resources';

const TRAVEL_SEC_PER_TILE = 60; // Dev: 1 min/Tile
const RAID_INTENSITY = 0.5;

export class RaidError extends Error {}

export interface StartRaidParams {
  cityId: number;
  targetX: number;
  targetY: number;
  troops: Force;
}

const chebyshev = (ax: number, ay: number, bx: number, by: number): number =>
  Math.max(Math.abs(ax - bx), Math.abs(ay - by));

function totalCarry(force: Force, gameData: GameData): number {
  let sum = 0;
  for (const [unit, qty] of Object.entries(force)) {
    sum += (gameData.units.units[unit]?.carry ?? 0) * qty;
  }
  return sum;
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

/** Löst fällige Truppenbewegungen auf: Ankunft (Kampf + Beute) und Rückkehr. */
export async function resolveDueMilitary(
  db: Kysely<Database>,
  gameData: GameData,
  now: Date = new Date(),
): Promise<number[]> {
  const due = await db
    .selectFrom('military_actions')
    .selectAll()
    .where('resolve_at', '<=', now)
    .orderBy('resolve_at')
    .execute();

  const changed = new Set<number>();
  for (const action of due) {
    if (action.phase === 'return') {
      await resolveReturn(db, action);
    } else if (action.kind === 'raid') {
      await resolveRaidArrival(db, gameData, action);
    } else {
      await db.deleteFrom('military_actions').where('id', '=', action.id).execute();
    }
    changed.add(action.origin_city);
  }
  return [...changed];
}

async function resolveRaidArrival(
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

/** Stellt die Bewegung auf Rückkehr um (gleiche Reisedauer wie hin). */
async function sendBack(
  db: Kysely<Database>,
  action: Selectable<MilitaryActionsTable>,
  survivors: Force,
  cargo: Record<string, number>,
): Promise<void> {
  const travelOutMs = action.resolve_at.getTime() - action.depart_at.getTime();
  await db
    .updateTable('military_actions')
    .set({
      phase: 'return',
      troops: JSON.stringify(survivors),
      cargo: JSON.stringify(cargo),
      resolve_at: new Date(action.resolve_at.getTime() + travelOutMs),
    })
    .where('id', '=', action.id)
    .execute();
}

async function resolveReturn(db: Kysely<Database>, action: Selectable<MilitaryActionsTable>): Promise<void> {
  // Truppen zurück in die Garnison.
  for (const [unit, qty] of Object.entries(action.troops)) {
    if (qty <= 0) continue;
    await db
      .insertInto('garrison')
      .values({ city_id: action.origin_city, unit_key: unit, qty })
      .onConflict((oc) => oc.columns(['city_id', 'unit_key']).doUpdateSet((eb) => ({ qty: eb('garrison.qty', '+', qty) })))
      .execute();
  }

  // Beute der Stadt gutschreiben (gedeckelt).
  const cargo = action.cargo ?? {};
  if (Object.keys(cargo).length > 0) {
    const at = action.resolve_at;
    await materializeResources(db, action.origin_city, at);
    const city = await db
      .selectFrom('cities')
      .select(['timber', 'stone', 'iron', 'cap_timber', 'cap_stone', 'cap_iron'])
      .where('id', '=', action.origin_city)
      .executeTakeFirstOrThrow();
    await db
      .updateTable('cities')
      .set({
        timber: Math.min(city.cap_timber, city.timber + (cargo.timber ?? 0)),
        stone: Math.min(city.cap_stone, city.stone + (cargo.stone ?? 0)),
        iron: Math.min(city.cap_iron, city.iron + (cargo.iron ?? 0)),
      })
      .where('id', '=', action.origin_city)
      .execute();
  }

  await db.deleteFrom('military_actions').where('id', '=', action.id).execute();
}
