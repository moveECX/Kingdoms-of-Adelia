/**
 * Koordiniert die Auflösung fälliger Truppenbewegungen: routet nach Phase (Rückkehr)
 * bzw. Art (PvE-Raid / PvP-Angriff). Gibt die IDs aller betroffenen Städte zurück
 * (Ursprung + bei PvP auch das Ziel) für WS-Deltas.
 */
import type { Kysely } from 'kysely';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { resolveReturn } from './movement';
import { resolveRaidArrival } from './raid';
import { resolvePvpArrival } from './pvp';

const PVP_KINDS = new Set(['scout', 'plunder', 'assault']);

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
    changed.add(action.origin_city);
    if (action.phase === 'return') {
      await resolveReturn(db, action);
    } else if (action.kind === 'raid') {
      await resolveRaidArrival(db, gameData, action);
    } else if (PVP_KINDS.has(action.kind)) {
      for (const id of await resolvePvpArrival(db, gameData, action)) changed.add(id);
    } else {
      await db.deleteFrom('military_actions').where('id', '=', action.id).execute();
    }
  }
  return [...changed];
}
