import type { Kysely } from 'kysely';
import { buildingCost } from '@adelia/shared/formulas/cost';
import { buildTimeSec } from '@adelia/shared/formulas/buildtime';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { materializeResources } from './resources';

export interface StartBuildParams {
  cityId: number;
  slotX: number;
  slotY: number;
  /** Neubau: gewünschtes Gebäude. Ausbau: muss zum vorhandenen Gebäude passen. */
  buildingKey: string;
}

export interface StartedBuild {
  jobId: number;
  toLevel: number;
  resolveAt: Date;
}

/** Fachlicher Fehler (vom Aufrufer in eine 4xx-Antwort übersetzbar). */
export class BuildError extends Error {}

/**
 * Startet einen Neubau oder Ausbau in einem Slot (#010): validiert Slot,
 * Voraussetzung, Maximalstufe und Ressourcen, zieht die Kosten ab und reiht
 * den Auftrag mit `resolve_at` ein. Der Scheduler stellt ihn später fertig.
 */
export async function startBuild(
  db: Kysely<Database>,
  params: StartBuildParams,
  gameData: GameData,
  now: Date = new Date(),
): Promise<StartedBuild> {
  const def = gameData.buildings.buildings[params.buildingKey];
  if (def === undefined) throw new BuildError(`Unbekanntes Gebäude: ${params.buildingKey}`);

  const queued = await db
    .selectFrom('build_queue')
    .select('id')
    .where('city_id', '=', params.cityId)
    .where('slot_x', '=', params.slotX)
    .where('slot_y', '=', params.slotY)
    .executeTakeFirst();
  if (queued !== undefined) throw new BuildError('Slot hat bereits einen Bauauftrag');

  const existing = await db
    .selectFrom('city_buildings')
    .select(['building_key', 'level'])
    .where('city_id', '=', params.cityId)
    .where('slot_x', '=', params.slotX)
    .where('slot_y', '=', params.slotY)
    .executeTakeFirst();

  let toLevel = 1;
  if (existing !== undefined) {
    if (existing.building_key !== params.buildingKey) {
      throw new BuildError('Slot ist mit einem anderen Gebäude belegt');
    }
    toLevel = existing.level + 1;
  }
  if (toLevel > def.maxLevel) throw new BuildError('Maximalstufe erreicht');

  const reqHall = def.prereq?.hall ?? 0;
  if (reqHall > 0) {
    const hall = await db
      .selectFrom('city_buildings')
      .select('level')
      .where('city_id', '=', params.cityId)
      .where('building_key', '=', 'hall')
      .executeTakeFirst();
    if ((hall?.level ?? 0) < reqHall) throw new BuildError(`Benötigt Hall Stufe ${reqHall}`);
  }

  const cost = buildingCost({ cost: def.cost ?? [] }, toLevel);

  // Ressourcen auf jetzt bringen, prüfen, abziehen.
  await materializeResources(db, params.cityId, now);
  const city = await db
    .selectFrom('cities')
    .select(['timber', 'stone', 'construction_pct'])
    .where('id', '=', params.cityId)
    .executeTakeFirstOrThrow();
  if (city.timber < cost.timber || city.stone < cost.stone) {
    throw new BuildError('Nicht genug Ressourcen');
  }

  const durationSec = buildTimeSec({ buildTimeSec: def.buildTimeSec ?? [] }, toLevel, city.construction_pct);
  const resolveAt = new Date(now.getTime() + durationSec * 1000);

  const countRow = await db
    .selectFrom('build_queue')
    .select((eb) => eb.fn.countAll<number>().as('c'))
    .where('city_id', '=', params.cityId)
    .executeTakeFirstOrThrow();

  await db
    .updateTable('cities')
    .set({ timber: city.timber - cost.timber, stone: city.stone - cost.stone })
    .where('id', '=', params.cityId)
    .execute();

  const job = await db
    .insertInto('build_queue')
    .values({
      city_id: params.cityId,
      slot_x: params.slotX,
      slot_y: params.slotY,
      building_key: params.buildingKey,
      to_level: toLevel,
      started_at: now,
      resolve_at: resolveAt,
      ordinal: countRow.c + 1,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return { jobId: job.id, toLevel, resolveAt };
}
