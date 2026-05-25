/**
 * Geteilte Truppenbewegungs-Helfer für PvE-Raids (`raid.ts`) und PvP-Angriffe (`pvp.ts`):
 * Distanz/Reisezeit, Carry-Summe, Rückreise und Heimkehr (Truppen + Beute gutschreiben).
 */
import type { Kysely, Selectable } from 'kysely';
import type { Force } from '@adelia/shared/formulas/combat';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database, MilitaryActionsTable } from '../db/types';
import { materializeResources } from './resources';

export const TRAVEL_SEC_PER_TILE = 60; // Dev: 1 min/Tile

export const chebyshev = (ax: number, ay: number, bx: number, by: number): number =>
  Math.max(Math.abs(ax - bx), Math.abs(ay - by));

export function totalCarry(force: Force, gameData: GameData): number {
  let sum = 0;
  for (const [unit, qty] of Object.entries(force)) {
    sum += (gameData.units.units[unit]?.carry ?? 0) * qty;
  }
  return sum;
}

/** Stellt eine Aktion auf Rückreise um (gleiche Dauer wie hin), mit Überlebenden + Fracht. */
export async function sendBack(
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

/** Truppen + Beute kehren in die Ursprungsstadt zurück (Beute auf Cap gedeckelt). */
export async function resolveReturn(db: Kysely<Database>, action: Selectable<MilitaryActionsTable>): Promise<void> {
  for (const [unit, qty] of Object.entries(action.troops)) {
    if (qty <= 0) continue;
    await db
      .insertInto('garrison')
      .values({ city_id: action.origin_city, unit_key: unit, qty })
      .onConflict((oc) => oc.columns(['city_id', 'unit_key']).doUpdateSet((eb) => ({ qty: eb('garrison.qty', '+', qty) })))
      .execute();
  }

  const cargo = action.cargo ?? {};
  if (Object.keys(cargo).length > 0) {
    const at = action.resolve_at;
    await materializeResources(db, action.origin_city, at);
    const city = await db
      .selectFrom('cities')
      .select(['timber', 'stone', 'iron', 'grain', 'cap_timber', 'cap_stone', 'cap_iron', 'cap_grain'])
      .where('id', '=', action.origin_city)
      .executeTakeFirstOrThrow();
    await db
      .updateTable('cities')
      .set({
        timber: Math.min(city.cap_timber, city.timber + (cargo.timber ?? 0)),
        stone: Math.min(city.cap_stone, city.stone + (cargo.stone ?? 0)),
        iron: Math.min(city.cap_iron, city.iron + (cargo.iron ?? 0)),
        grain: Math.min(city.cap_grain, city.grain + (cargo.grain ?? 0)),
      })
      .where('id', '=', action.origin_city)
      .execute();
  }

  await db.deleteFrom('military_actions').where('id', '=', action.id).execute();
}
