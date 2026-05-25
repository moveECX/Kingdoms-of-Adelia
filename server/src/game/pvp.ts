/**
 * PvP-Angriffe auf fremde Städte (GAME-MECHANICS §5). Angriffstypen brauchen eine
 * Citadel in der Ausgangsstadt; das Ziel muss fremd und ungeschützt sein.
 * - Scout: kein Kampf, Aufklärungsbericht (Garnison + Ressourcen).
 * - Plunder: Kampf (I=0.01), bei Sieg Beute (durch Carry gedeckelt); Gebäude unversehrt.
 * - Assault: Kampf (I=0.5), keine Beute; vernichtet Truppen.
 * - Siege: Kampf (I=0.5) mit Marshal; Sieg + überlebender Marshal beansprucht
 *   10 %/Welle (6 % nachts); 100 % = Eroberung. Marshal-Tod setzt den Fortschritt zurück.
 * Modifikatoren (aus units.yaml `combat`): City Wall, Nachtschutz (Angreifer −40%).
 */
import type { Kysely, Selectable } from 'kysely';
import { resolveCombat, toCombatStats, type Force } from '@adelia/shared/formulas/combat';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database, MilitaryActionsTable } from '../db/types';
import { TRAVEL_SEC_PER_TILE, chebyshev, totalCarry, sendBack } from './movement';
import { materializeResources } from './resources';

export type AttackKind = 'scout' | 'plunder' | 'assault' | 'siege';
export class AttackError extends Error {}

export interface StartAttackParams {
  cityId: number;
  targetX: number;
  targetY: number;
  troops: Force;
  kind: AttackKind;
}

/** Nachtschutz (Serverzeit = UTC); Grenzen aus units.yaml combat.nightProtection. */
function isNight(at: Date, fromHour: number, toHour: number): boolean {
  const h = at.getUTCHours();
  return fromHour <= toHour ? h >= fromHour && h < toHour : h >= fromHour || h < toHour;
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
  if (params.kind === 'siege' && (params.troops['marshal'] ?? 0) <= 0) {
    throw new AttackError('Belagerung erfordert einen Marshal');
  }

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

  const combat = gameData.units.combat;
  const stats = toCombatStats(gameData.units.units);
  const wall = await db
    .selectFrom('city_buildings')
    .select('level')
    .where('city_id', '=', target.id)
    .where('building_key', '=', 'city_wall')
    .executeTakeFirst();
  const wallMult =
    wall === undefined
      ? 1
      : 1 + (combat.wallBonusPct[Math.min(wall.level, combat.wallBonusPct.length) - 1] ?? 0) / 100;
  const np = combat.nightProtection;
  const night = isNight(action.resolve_at, np.fromHour, np.toHour);
  const nightMult = night ? 1 - np.attackerPenaltyPct / 100 : 1;
  const intensity =
    action.kind === 'plunder' ? (combat.intensity['plunderDefender'] ?? 0.01) : (combat.intensity['assault'] ?? 0.5);

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
    Object.assign(cargo, await plunder(db, target.id, result.attackerSurvivors, gameData, action.resolve_at));
  }

  let conquered = false;
  let siegeProgress: number | undefined;
  if (action.kind === 'siege') {
    const marshalSurvived = (result.attackerSurvivors['marshal'] ?? 0) > 0;
    if (result.attackerWins && marshalSurvived) {
      const current = await db
        .selectFrom('cities')
        .select('siege_progress')
        .where('id', '=', target.id)
        .executeTakeFirstOrThrow();
      const progress = current.siege_progress + (night ? 6 : 10);
      if (progress >= 100 && attackerId !== null) {
        conquered = true;
        await db.deleteFrom('garrison').where('city_id', '=', target.id).execute();
        await db
          .updateTable('cities')
          .set({ account_id: attackerId, siege_progress: 0, protected_until: null })
          .where('id', '=', target.id)
          .execute();
      } else {
        siegeProgress = Math.min(99, progress);
        await db.updateTable('cities').set({ siege_progress: siegeProgress }).where('id', '=', target.id).execute();
      }
    } else if (!marshalSurvived) {
      siegeProgress = 0;
      await db.updateTable('cities').set({ siege_progress: 0 }).where('id', '=', target.id).execute();
    }
  }

  await writeReport(db, attackerId, target.account_id, action, {
    kind: action.kind,
    attackerWins: result.attackerWins,
    attackPower: result.attackPower,
    defensePower: result.defensePower,
    attackerLosses: result.attackerLosses,
    defenderLosses: result.defenderLosses,
    loot: cargo,
    nightProtection: night,
    wallMult,
    ...(action.kind === 'siege' ? { conquered, siegeProgress } : {}),
  });

  const survivorTotal = Object.values(result.attackerSurvivors).reduce((s, q) => s + q, 0);
  if (survivorTotal > 0) await sendBack(db, action, result.attackerSurvivors, cargo);
  else await db.deleteFrom('military_actions').where('id', '=', action.id).execute();

  return [target.id];
}

/** Plünderung: nimmt einen proportionalen Anteil aller Ressourcen, gedeckelt auf Carry. */
async function plunder(
  db: Kysely<Database>,
  cityId: number,
  survivors: Force,
  gameData: GameData,
  at: Date,
): Promise<Record<string, number>> {
  await materializeResources(db, cityId, at);
  const fresh = await db
    .selectFrom('cities')
    .select(['timber', 'stone', 'iron', 'grain'])
    .where('id', '=', cityId)
    .executeTakeFirstOrThrow();
  const total = fresh.timber + fresh.stone + fresh.iron + fresh.grain;
  const take = Math.min(total, totalCarry(survivors, gameData));
  const factor = total > 0 ? take / total : 0;
  const loot = {
    timber: Math.floor(fresh.timber * factor),
    stone: Math.floor(fresh.stone * factor),
    iron: Math.floor(fresh.iron * factor),
    grain: Math.floor(fresh.grain * factor),
  };
  await db
    .updateTable('cities')
    .set({
      timber: fresh.timber - loot.timber,
      stone: fresh.stone - loot.stone,
      iron: fresh.iron - loot.iron,
      grain: fresh.grain - loot.grain,
    })
    .where('id', '=', cityId)
    .execute();
  return loot;
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
