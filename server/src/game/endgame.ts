/**
 * Endgame (GAME-MECHANICS §9): Paläste in von Schreinen erleuchteten Allianzstädten;
 * allianzweite Faith pro Tugend; Sieg, wenn eine Allianz einen L10-Palast jeder der
 * acht Tugenden besitzt → die Welt endet.
 */
import type { Kysely } from 'kysely';
import { VIRTUES, MAX_PALACE_LEVEL, type Virtue } from '@adelia/shared/constants/game';
import type { Database } from '../db/types';
import { chebyshev } from './movement';

export class EndgameError extends Error {}

const SHRINE_RANGE = 50; // [A] Erleuchtungs-Reichweite in Tiles

function isVirtue(s: string): s is Virtue {
  return (VIRTUES as readonly string[]).includes(s);
}

export interface BuildPalaceParams {
  cityId: number;
  virtue: string;
}

export async function buildPalace(
  db: Kysely<Database>,
  params: BuildPalaceParams,
  now: Date = new Date(),
): Promise<{ level: number; victory: boolean }> {
  if (!isVirtue(params.virtue)) throw new EndgameError('Unbekannte Tugend');
  const world = await db.selectFrom('world_state').select('ended').where('id', '=', 1).executeTakeFirst();
  if (world?.ended === true) throw new EndgameError('Die Welt ist bereits entschieden');

  const city = await db
    .selectFrom('cities')
    .select(['x', 'y', 'account_id'])
    .where('id', '=', params.cityId)
    .executeTakeFirstOrThrow();
  const acc = await db
    .selectFrom('accounts')
    .select('alliance_id')
    .where('id', '=', city.account_id)
    .executeTakeFirstOrThrow();
  if (acc.alliance_id === null) throw new EndgameError('Nur Mitglieder einer Allianz können Paläste bauen');

  const shrines = await db
    .selectFrom('shrines')
    .select(['x', 'y'])
    .where('virtue', '=', params.virtue)
    .where('active', '=', true)
    .execute();
  const illuminated = shrines.some((s) => chebyshev(city.x, city.y, s.x, s.y) <= SHRINE_RANGE);
  if (!illuminated) throw new EndgameError('Kein aktiver Schrein dieser Tugend in Reichweite');

  const existing = await db.selectFrom('palaces').selectAll().where('city_id', '=', params.cityId).executeTakeFirst();
  let level: number;
  if (existing === undefined) {
    await db.insertInto('palaces').values({ city_id: params.cityId, virtue: params.virtue, level: 1 }).execute();
    level = 1;
  } else {
    if (existing.virtue !== params.virtue) {
      throw new EndgameError('Diese Stadt hat bereits einen Palast einer anderen Tugend');
    }
    if (existing.level >= MAX_PALACE_LEVEL) throw new EndgameError('Der Palast ist bereits auf Maximalstufe');
    level = existing.level + 1;
    await db.updateTable('palaces').set({ level }).where('id', '=', existing.id).execute();
  }

  const victory = await checkVictory(db, acc.alliance_id, now);
  return { level, victory };
}

/** Prüft, ob die Allianz einen L10-Palast jeder Tugend besitzt; setzt ggf. den Sieg. */
export async function checkVictory(db: Kysely<Database>, allianceId: number, now: Date): Promise<boolean> {
  const rows = await db
    .selectFrom('palaces')
    .innerJoin('cities', 'cities.id', 'palaces.city_id')
    .innerJoin('accounts', 'accounts.id', 'cities.account_id')
    .select('palaces.virtue')
    .where('accounts.alliance_id', '=', allianceId)
    .where('palaces.level', '=', MAX_PALACE_LEVEL)
    .execute();
  const maxed = new Set(rows.map((r) => r.virtue));
  const complete = VIRTUES.every((v) => maxed.has(v));
  if (complete) {
    await db
      .updateTable('world_state')
      .set({ ended: true, champion_alliance: allianceId, ended_at: now })
      .where('id', '=', 1)
      .execute();
  }
  return complete;
}

/** Allianzweite Faith je Tugend = Summe der Palast-Stufen der Mitglieder. */
export async function allianceFaith(db: Kysely<Database>, allianceId: number): Promise<Record<string, number>> {
  const rows = await db
    .selectFrom('palaces')
    .innerJoin('cities', 'cities.id', 'palaces.city_id')
    .innerJoin('accounts', 'accounts.id', 'cities.account_id')
    .select(['palaces.virtue', 'palaces.level'])
    .where('accounts.alliance_id', '=', allianceId)
    .execute();
  const faith: Record<string, number> = {};
  for (const v of VIRTUES) faith[v] = 0;
  for (const r of rows) faith[r.virtue] = (faith[r.virtue] ?? 0) + r.level;
  return faith;
}
