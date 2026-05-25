/**
 * PvP-Smoke (P4 #1): dev plündert aldara. Belegt Citadel-Gate, Kampf gegen die
 * Garnison, Loot (durch Carry gedeckelt), Verteidiger-Verluste und einen
 * Kampfbericht, der beide Seiten nennt.
 *   (Server vorher stoppen!)  npx tsx --env-file=.env server/src/dev/pvp-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { startAttack, AttackError } from '../game/pvp';
import { resolveDueMilitary } from '../game/military';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${msg}`);
}

const db = createDb();
const gameData = loadGameData();
const t0 = new Date('2026-01-01T12:00:00Z'); // 12 Uhr UTC → kein Nachtschutz

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons RESTART IDENTITY CASCADE`.execute(db);

const attacker = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@a.local', password_hash: 'x' })
  .returning('id')
  .executeTakeFirstOrThrow();
const defender = await db
  .insertInto('accounts')
  .values({ username: 'aldara', email: 'aldara@a.local', password_hash: 'x' })
  .returning('id')
  .executeTakeFirstOrThrow();

const atkCity = await foundCity(db, { accountId: attacker.id, x: 100, y: 100, seed: 1 }, gameData, t0);
const defCity = await foundCity(db, { accountId: defender.id, x: 103, y: 100, seed: 2 }, gameData, t0);

// Angreifer: Citadel (Gate) + Berserker-Armee.
await db
  .insertInto('city_buildings')
  .values({ city_id: atkCity, slot_x: 0, slot_y: 0, building_key: 'citadel', level: 8 })
  .execute();
await db.insertInto('garrison').values({ city_id: atkCity, unit_key: 'berserker', qty: 1000 }).execute();

// Verteidiger: kleine Garnison + plünderbare Ressourcen, kein Schild.
await db.insertInto('garrison').values({ city_id: defCity, unit_key: 'ranger', qty: 50 }).execute();
await db
  .updateTable('cities')
  .set({ timber: 5000, stone: 5000, iron: 5000, grain: 5000, protected_until: null })
  .where('id', '=', defCity)
  .execute();

const action = await startAttack(
  db,
  { cityId: atkCity, targetX: 103, targetY: 100, troops: { berserker: 1000 }, kind: 'plunder' },
  t0,
);
console.log(`Plünderung #${action.actionId} startet, Ankunft ${action.resolveAt.toISOString()}`);

await resolveDueMilitary(db, gameData, new Date(action.resolveAt.getTime() + 1000));

const report = await db.selectFrom('combat_reports').selectAll().orderBy('id', 'desc').executeTakeFirstOrThrow();
const detail = report.detail as {
  attackerWins: boolean;
  loot: Record<string, number>;
  defenderLosses: Record<string, number>;
};
console.log(
  `Bericht: attackerWins=${String(detail.attackerWins)} loot=${JSON.stringify(detail.loot)} defenderLosses=${JSON.stringify(detail.defenderLosses)}`,
);
assert(report.attacker_id === attacker.id && report.defender_id === defender.id, 'Bericht nennt beide Seiten');
assert(detail.attackerWins, 'Angreifer gewinnt (1000 Berserker vs 50 Ranger)');
const lootSum = Object.values(detail.loot).reduce((s, n) => s + n, 0);
assert(lootSum > 0, 'Beute > 0');

const defAfter = await db
  .selectFrom('cities')
  .select(['timber', 'stone', 'iron', 'grain'])
  .where('id', '=', defCity)
  .executeTakeFirstOrThrow();
assert(defAfter.timber < 5000, 'Verteidiger-Timber wurde geplündert');

// Citadel-Gate: ohne Citadel wird der Angriff abgewiesen.
await db.deleteFrom('city_buildings').where('city_id', '=', atkCity).where('building_key', '=', 'citadel').execute();
let gated = false;
try {
  await startAttack(db, { cityId: atkCity, targetX: 103, targetY: 100, troops: { berserker: 1 }, kind: 'plunder' }, t0);
} catch (err) {
  gated = err instanceof AttackError;
  console.log(`  ohne Citadel: ${err instanceof Error ? err.message : String(err)} (erwartet)`);
}
assert(gated, 'Angriff ohne Citadel wird abgewiesen');

await db.destroy();
console.log('PvP-Smoke OK.');
