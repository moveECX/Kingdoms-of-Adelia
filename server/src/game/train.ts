import type { Kysely } from 'kysely';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { materializeResources } from './resources';

export interface StartTrainingParams {
  cityId: number;
  unitKey: string;
  qty: number;
}

export interface StartedTraining {
  jobId: number;
  qty: number;
  resolveAt: Date;
}

export class TrainError extends Error {}

/**
 * Reiht ein Trainings-Batch ein (#P2-3): prüft Trainer-Gebäude, zieht Kosten
 * (Timber/Stone/Iron von der Stadt, Gold vom Account) ab und setzt `resolve_at`.
 * Vereinfachung Phase 2: das ganze Batch wird auf einmal fertig.
 */
export async function startTraining(
  db: Kysely<Database>,
  params: StartTrainingParams,
  gameData: GameData,
  now: Date = new Date(),
): Promise<StartedTraining> {
  const def = gameData.units.units[params.unitKey];
  if (def === undefined) throw new TrainError(`Unbekannte Einheit: ${params.unitKey}`);
  if (params.qty <= 0) throw new TrainError('Menge muss > 0 sein');

  const trainer = await db
    .selectFrom('city_buildings')
    .select(['level'])
    .where('city_id', '=', params.cityId)
    .where('building_key', '=', def.trainer.building)
    .orderBy('level', 'desc')
    .executeTakeFirst();
  if ((trainer?.level ?? 0) < def.trainer.level) {
    throw new TrainError(`Benötigt ${def.trainer.building} Stufe ${def.trainer.level}`);
  }

  const cost = {
    timber: def.cost.timber * params.qty,
    stone: def.cost.stone * params.qty,
    iron: def.cost.iron * params.qty,
    gold: def.cost.gold * params.qty,
  };

  await materializeResources(db, params.cityId, now);
  const city = await db
    .selectFrom('cities')
    .select(['account_id', 'timber', 'stone', 'iron'])
    .where('id', '=', params.cityId)
    .executeTakeFirstOrThrow();
  const account = await db
    .selectFrom('accounts')
    .select(['gold'])
    .where('id', '=', city.account_id)
    .executeTakeFirstOrThrow();
  if (
    city.timber < cost.timber ||
    city.stone < cost.stone ||
    city.iron < cost.iron ||
    account.gold < cost.gold
  ) {
    throw new TrainError('Nicht genug Ressourcen');
  }

  await db
    .updateTable('cities')
    .set({ timber: city.timber - cost.timber, stone: city.stone - cost.stone, iron: city.iron - cost.iron })
    .where('id', '=', params.cityId)
    .execute();
  if (cost.gold > 0) {
    await db
      .updateTable('accounts')
      .set({ gold: account.gold - cost.gold })
      .where('id', '=', city.account_id)
      .execute();
  }

  const resolveAt = new Date(now.getTime() + params.qty * def.trainingTimeSec * 1000);
  const job = await db
    .insertInto('training_queue')
    .values({
      city_id: params.cityId,
      unit_key: params.unitKey,
      qty_total: params.qty,
      qty_done: 0,
      resolve_at: resolveAt,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return { jobId: job.id, qty: params.qty, resolveAt };
}
