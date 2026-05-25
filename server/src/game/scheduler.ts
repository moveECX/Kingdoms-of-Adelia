import type { Kysely } from 'kysely';
import type { GameData } from '@adelia/shared/schemas/data';
import { TICK_INTERVAL_MS } from '@adelia/shared/constants/game';
import type { Database } from '../db/types';
import { recomputeCity } from './recompute';

/**
 * Löst alle fälligen Bauaufträge auf (#010): setzt/erhöht das Gebäude, entfernt
 * den Queue-Eintrag und berechnet die Stadt **zum Abschlusszeitpunkt** neu
 * (deterministisch, unabhängig vom realen Tick). Gibt die Anzahl auf­gelöster
 * Aufträge zurück.
 */
export async function resolveDueBuilds(
  db: Kysely<Database>,
  gameData: GameData,
  now: Date = new Date(),
): Promise<number> {
  const due = await db
    .selectFrom('build_queue')
    .selectAll()
    .where('resolve_at', '<=', now)
    .orderBy('resolve_at')
    .execute();

  for (const job of due) {
    const existing = await db
      .selectFrom('city_buildings')
      .select(['id'])
      .where('city_id', '=', job.city_id)
      .where('slot_x', '=', job.slot_x)
      .where('slot_y', '=', job.slot_y)
      .executeTakeFirst();

    if (existing !== undefined) {
      await db.updateTable('city_buildings').set({ level: job.to_level }).where('id', '=', existing.id).execute();
    } else {
      await db
        .insertInto('city_buildings')
        .values({
          city_id: job.city_id,
          slot_x: job.slot_x,
          slot_y: job.slot_y,
          building_key: job.building_key,
          level: job.to_level,
        })
        .execute();
    }

    await db.deleteFrom('build_queue').where('id', '=', job.id).execute();
    await recomputeCity(db, job.city_id, gameData, job.resolve_at);
  }

  return due.length;
}

/** Startet die periodische Auflösung (für den Server, #012). */
export function startScheduler(
  db: Kysely<Database>,
  gameData: GameData,
  intervalMs: number = TICK_INTERVAL_MS,
): NodeJS.Timeout {
  return setInterval(() => {
    resolveDueBuilds(db, gameData).catch((err: unknown) => {
      console.error('Scheduler-Fehler:', err);
    });
  }, intervalMs);
}
