import type { Kysely } from 'kysely';
import { generateCityTiles, HALL_SLOT } from '@adelia/shared/formulas/terrain';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { recomputeCity } from './recompute';
import { materializeResources } from './resources';

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

export class FoundCityError extends Error {}

// Dev-Kosten (GAME-MECHANICS.md §6 nennt 100k/100k/25k/25k; hier erreichbar gehalten).
const FOUND_COST = { timber: 2000, stone: 2000 };
const SHIELD_MS = 7 * 24 * 60 * 60 * 1000;

export interface FoundNewCityParams {
  accountId: number;
  sourceCityId: number;
  x: number;
  y: number;
  seed: number;
}

/**
 * Gründet eine weitere Stadt (#P2-5): prüft das Städte-Limit (titles.yaml),
 * zieht die Kosten von der Quell-Stadt ab, belegt den Zielort und vergibt
 * der neuen Stadt einen 7-Tage-Schutz.
 */
export async function foundNewCity(
  db: Kysely<Database>,
  params: FoundNewCityParams,
  gameData: GameData,
  now: Date = new Date(),
): Promise<number> {
  const account = await db
    .selectFrom('accounts')
    .select(['title'])
    .where('id', '=', params.accountId)
    .executeTakeFirstOrThrow();
  const maxCities = gameData.titles.titles.find((t) => t.key === account.title)?.maxCities ?? 1;
  const count = await db
    .selectFrom('cities')
    .select((eb) => eb.fn.countAll<number>().as('c'))
    .where('account_id', '=', params.accountId)
    .executeTakeFirstOrThrow();
  if (count.c >= maxCities) throw new FoundCityError(`Städte-Limit erreicht (${maxCities})`);

  const occupied = await db.selectFrom('cities').select('id').where('x', '=', params.x).where('y', '=', params.y).executeTakeFirst();
  if (occupied !== undefined) throw new FoundCityError('Zielort ist bereits belegt');

  await materializeResources(db, params.sourceCityId, now);
  const src = await db
    .selectFrom('cities')
    .select(['timber', 'stone'])
    .where('id', '=', params.sourceCityId)
    .executeTakeFirstOrThrow();
  if (src.timber < FOUND_COST.timber || src.stone < FOUND_COST.stone) {
    throw new FoundCityError('Nicht genug Ressourcen in der Quell-Stadt');
  }
  await db
    .updateTable('cities')
    .set({ timber: src.timber - FOUND_COST.timber, stone: src.stone - FOUND_COST.stone })
    .where('id', '=', params.sourceCityId)
    .execute();

  const newCityId = await foundCity(db, { accountId: params.accountId, x: params.x, y: params.y, seed: params.seed }, gameData, now);
  await db
    .updateTable('cities')
    .set({ protected_until: new Date(now.getTime() + SHIELD_MS) })
    .where('id', '=', newCityId)
    .execute();
  return newCityId;
}
