import type { Kysely } from 'kysely';
import { generateCityTiles, HALL_SLOT } from '@adelia/shared/formulas/terrain';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { recomputeCity } from './recompute';

export interface FoundCityParams {
  accountId: number;
  x: number;
  y: number;
  seed: number;
}

/**
 * Gründet eine Stadt: legt die Stadt an, generiert das Terrain (#008),
 * platziert die Hall (Stufe 1) im Zentrum und berechnet die Produktion.
 * Gibt die neue cityId zurück.
 */
export async function foundCity(
  db: Kysely<Database>,
  params: FoundCityParams,
  gameData: GameData,
  now: Date = new Date(),
): Promise<number> {
  const city = await db
    .insertInto('cities')
    .values({ account_id: params.accountId, x: params.x, y: params.y, resources_as_of: now })
    .returning('id')
    .executeTakeFirstOrThrow();

  const tiles = generateCityTiles(params.seed);
  await db
    .insertInto('city_tiles')
    .values(
      tiles.map((t) => ({
        city_id: city.id,
        slot_x: t.slotX,
        slot_y: t.slotY,
        node_type: t.nodeType,
      })),
    )
    .execute();

  await db
    .insertInto('city_buildings')
    .values({ city_id: city.id, slot_x: HALL_SLOT, slot_y: HALL_SLOT, building_key: 'hall', level: 1 })
    .execute();

  await recomputeCity(db, city.id, gameData, now);
  return city.id;
}
