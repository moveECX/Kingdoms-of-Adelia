import type { Kysely } from 'kysely';
import { deriveAmount } from '@adelia/shared/formulas/resources';
import type { Database } from '../db/types';

/**
 * Materialisiert die analytisch berechneten Ressourcen einer Stadt:
 * schreibt die aktuellen (gedeckelten) Beträge zurück und setzt `resources_as_of`.
 * Muss VOR jeder Ratenänderung laufen (sonst geht akkumulierte Produktion verloren).
 */
export async function materializeResources(
  db: Kysely<Database>,
  cityId: number,
  now: Date = new Date(),
): Promise<void> {
  const city = await db
    .selectFrom('cities')
    .select([
      'timber', 'stone', 'iron', 'grain',
      'timber_rate_h', 'stone_rate_h', 'iron_rate_h', 'grain_rate_h',
      'cap_timber', 'cap_stone', 'cap_iron', 'cap_grain',
      'resources_as_of',
    ])
    .where('id', '=', cityId)
    .executeTakeFirst();
  if (city === undefined) throw new Error(`Stadt ${cityId} nicht gefunden`);

  const elapsedMs = now.getTime() - city.resources_as_of.getTime();
  const cur = (amount: number, ratePerH: number, cap: number): number =>
    deriveAmount({ amount, ratePerH, cap, elapsedMs });

  await db
    .updateTable('cities')
    .set({
      timber: cur(city.timber, city.timber_rate_h, city.cap_timber),
      stone: cur(city.stone, city.stone_rate_h, city.cap_stone),
      iron: cur(city.iron, city.iron_rate_h, city.cap_iron),
      grain: cur(city.grain, city.grain_rate_h, city.cap_grain),
      resources_as_of: now,
    })
    .where('id', '=', cityId)
    .execute();
}
