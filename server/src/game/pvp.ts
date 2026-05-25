/**
 * PvP-Angriffe auf fremde Städte (GAME-MECHANICS §5). Angriffstypen brauchen eine
 * Citadel in der Ausgangsstadt; das Ziel muss fremd und ungeschützt sein.
 * - Scout: kein Kampf, liefert einen Aufklärungsbericht (Garnison + Ressourcen).
 * - Plunder: Kampf (I=0.01), bei Sieg Beute (durch Carry gedeckelt); Gebäude unversehrt.
 * - Assault: Kampf (I=0.5), keine Beute; vernichtet Truppen.
 * Modifikatoren: City Wall (Verteidigung), Nachtschutz (Angreifer −40%, 22–10 Uhr UTC).
 */
import type { Kysely, Selectable } from 'kysely';
import { resolveCombat, toCombatStats, type Force } from '@adelia/shared/formulas/combat';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database, MilitaryActionsTable } from '../db/types';
import { TRAVEL_SEC_PER_TILE, chebyshev, totalCarry, sendBack } from './movement';
import { materializeResources } from './resources';

export type AttackKind = 'scout' | 'plunder' | 'assault';
export class AttackError extends Error {}

/** City-Wall-Verteidigungsbonus in % je Stufe (L1→L10, GAME-MECHANICS §3.7). */
const WALL_BONUS_PCT = [1, 3, 6, 10, 15, 20, 26, 33, 41, 50];

export interface StartAttackParams {
  cityId: number;
  targetX: number;
  targetY: number;
  troops: Force;
  kind: AttackKind;
}

/** Nachtschutz 22–10 Uhr (Serverzeit = UTC): Angreifer-Offensive −40%. */
function isNight(at: Date): boolean {
  const h = at.getUTCHours();
  return h >= 22 || h < 10;
}

async function loadGarrison(db: Kysely<Database>, cityId: number): Promise<Force> {
  const rows = await db.selectFrom('garrison').select(['unit_key', 'qty']).where('city_id', '=', cityId).execute();
  const force: Force = {};
  for (const r of rows) if (r.qty > 0) force[r.unit_key] = r.qty;
  return force;
}

/** Schickt Truppen auf einen Angriff gegen eine fremde Stadt. */
export async function startAttack(
  db: Kysely<Database>,
  params: StartAttackParams,
  now: Date = new Date(),
): Promise<{ actionId: number; resolveAt: Date }> {
  const troops = Object.entries(params.troops).filter(([, q]) => q > 0);
  if (troops.length === 0) throw new AttackError('Keine Truppen ausgewählt');

  const origin = await db
    .selectFrom('cities')
    .select(['x', 'y', 'account_id'])
    .where('id', '=', params.cityId)
    .executeTakeFirstOrThrow();

  const citadel = await db
    .selectFrom('city_buildings')
    .select('id')
    .where('city_id', '=', params.cityId)
    .where('building_key', '=', 'citadel')
    .executeTakeFirst();
  if (citadel === undefined) throw new AttackError('Angriffe erfordern eine Citadel in der Ausgangsstadt');

  const target = await db
    .selectFrom('cities')
    .select(['id', 'account_id', 'protected_until'])
    .where('x', '=', params.targetX)
    .where('y', '=', params.targetY)
    .executeTakeFirst();
  if (target === undefined) throw new AttackError('Keine Stadt am Zielort');
  if (target.account_id === origin.account_id) throw new AttackError('Du kannst deine eigene Stadt nicht angreifen');
  if (target.protected_until !== null && target.protected_until > now) {
    throw new AttackError('Die Zielstadt steht unter Schutz');
  }

  for (const [unit, qty] of troops) {
    const g = await db
      .selectFrom('garrison')
      .select(['qty'])
      .where('city_id', '=', params.cityId)
      .where('unit_key', '=', unit)
      .executeTakeFirst();
    if ((g?.qty ?? 0) < qty) throw new AttackError(`Nicht genug ${unit} (${g?.qty ?? 0}/${qty})`);
  }
  for (const [unit, qty] of troops) {
    await db
      .updateTable('garrison')
      .set((eb) => ({ qty: eb('qty', '-', qty) }))
      .where('city_id', '=', params.cityId)
      .where('unit_key', '=', unit)
      .execute();
  }

  const travelSec = Math.max(1, chebyshev(origin.x, origin.y, params.targetX, params.targetY)) * TRAVEL_SEC_PER_TILE;
  const resolveAt = new Date(now.getTime() + travelSec * 1000);

  const action = await db
    .insertInto('military_actions')
    .values({
      kind: params.kind,
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

/** Löst die Ankunft eines PvP-Angriffs auf. Gibt betroffene Zielstädte (für WS-Deltas) zurück. */
export async function resolvePvpArrival(
  db: Kysely<Database>,
  gameData: GameData,
  action: Selectable<MilitaryActionsTable>,
): Promise<number[]> {
  const troops = action.troops;
  const target = await db
    .selectFrom('cities')
    .select(['id', 'account_id'])
    .where('x', '=', action.target_x)
    .where('y', '=', action.target_y)
    .executeTakeFirst();
  if (target === undefined) {
    await sendBack(db, action, troops, {});
    return [];
  }

  const origin = await db
    .selectFrom('cities')
    .select('account_id')
    .where('id', '=', action.origin_city)
    .executeTakeFirst();
  const attackerId = origin?.account_id ?? null;
  const garrison = await loadGarrison(db, target.id);

  // Scout: kein Kampf, nur Aufklärung.
  if (action.kind === 'scout') {
    await materializeResources(db, target.id, action.resolve_at);
    const res = await db
      .selectFrom('cities')
      .select(['timber', 'stone', 'iron', 'grain'])
      .where('id', '=', target.id)
      .executeTakeFirstOrThrow();
    await writeReport(db, attackerId, target.account_id, action, { kind: 'scout', garrison, resources: res });
    await sendBack(db, action, troops, {});
    return [target.id];
  }

  const stats = toCombatStats(gameData.units.units);
  const wall = await db
    .selectFrom('city_buildings')
    .select('level')
    .where('city_id', '=', target.id)
    .where('building_key', '=', 'city_wall')
    .executeTakeFirst();
  const wallMult = wall === undefined ? 1 : 1 + (WALL_BONUS_PCT[Math.min(wall.level, 10) - 1] ?? 0) / 100;
  const nightMult = isNight(action.resolve_at) ? 0.6 : 1;
  const intensity = action.kind === 'assault' ? 0.5 : 0.01;

  const result = resolveCombat({
    attackers: troops,
    defenders: garrison,
    stats,
    intensity,
    defenderDefenseMultiplier: wallMult,
    attackerAttackMultiplier: nightMult,
  });

  for (const [unit, lost] of Object.entries(result.defenderLosses)) {
    if (lost > 0) {
      await db
        .updateTable('garrison')
        .set((eb) => ({ qty: eb('qty', '-', lost) }))
        .where('city_id', '=', target.id)
        .where('unit_key', '=', unit)
        .execute();
    }
  }

  const cargo: Record<string, number> = {};
  if (action.kind === 'plunder' && result.attackerWins) {
    await materializeResources(db, target.id, action.resolve_at);
    const fresh = await db
      .selectFrom('cities')
      .select(['timber', 'stone', 'iron', 'grain'])
      .where('id', '=', target.id)
      .executeTakeFirstOrThrow();
    const total = fresh.timber + fresh.stone + fresh.iron + fresh.grain;
    const take = Math.min(total, totalCarry(result.attackerSurvivors, gameData));
    const factor = total > 0 ? take / total : 0;
    cargo.timber = Math.floor(fresh.timber * factor);
    cargo.stone = Math.floor(fresh.stone * factor);
    cargo.iron = Math.floor(fresh.iron * factor);
    cargo.grain = Math.floor(fresh.grain * factor);
    await db
      .updateTable('cities')
      .set({
        timber: fresh.timber - cargo.timber,
        stone: fresh.stone - cargo.stone,
        iron: fresh.iron - cargo.iron,
        grain: fresh.grain - cargo.grain,
      })
      .where('id', '=', target.id)
      .execute();
  }

  await writeReport(db, attackerId, target.account_id, action, {
    kind: action.kind,
    attackerWins: result.attackerWins,
    attackPower: result.attackPower,
    defensePower: result.defensePower,
    attackerLosses: result.attackerLosses,
    defenderLosses: result.defenderLosses,
    loot: cargo,
    nightProtection: nightMult < 1,
    wallMult,
  });

  const survivorTotal = Object.values(result.attackerSurvivors).reduce((s, q) => s + q, 0);
  if (survivorTotal > 0) await sendBack(db, action, result.attackerSurvivors, cargo);
  else await db.deleteFrom('military_actions').where('id', '=', action.id).execute();

  return [target.id];
}

async function writeReport(
  db: Kysely<Database>,
  attackerId: number | null,
  defenderId: number | null,
  action: Selectable<MilitaryActionsTable>,
  detail: Record<string, unknown>,
): Promise<void> {
  await db
    .insertInto('combat_reports')
    .values({
      attacker_id: attackerId,
      defender_id: defenderId,
      target_x: action.target_x,
      target_y: action.target_y,
      detail: JSON.stringify(detail),
    })
    .execute();
}
