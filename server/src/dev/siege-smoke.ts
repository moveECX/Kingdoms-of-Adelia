/**
 * Siege-Smoke (P4 #3): dev belagert aldara. Eine Welle mit Marshal treibt den
 * Fortschritt um 10 % (tags); bei ≥100 % wechselt die Stadt den Besitzer (Eroberung)
 * und die Belagerung wird zurückgesetzt.
 *   (Server vorher stoppen!)  npx tsx --env-file=.env server/src/dev/siege-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { startAttack } from '../game/pvp';
import { resolveDueMilitary } from '../game/military';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${msg}`);
}

const db = createDb();
const gameData = loadGameData();
const t0 = new Date('2026-01-01T12:00:00Z'); // 12 Uhr UTC → Tag → 10 %/Welle

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons RESTART IDENTITY CASCADE`.execute(db);

const atk = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'd@a.local', password_hash: 'x' })
  .returning('id')
  .executeTakeFirstOrThrow();
const def = await db
  .insertInto('accounts')
  .values({ username: 'aldara', email: 'a@a.local', password_hash: 'x' })
  .returning('id')
  .executeTakeFirstOrThrow();

const atkCity = await foundCity(db, { accountId: atk.id, x: 100, y: 100, seed: 1 }, gameData, t0);
const defCity = await foundCity(db, { accountId: def.id, x: 101, y: 100, seed: 2 }, gameData, t0);

await db
  .insertInto('city_buildings')
  .values({ city_id: atkCity, slot_x: 0, slot_y: 0, building_key: 'citadel', level: 8 })
  .execute();
await db.updateTable('cities').set({ protected_until: null }).where('id', '=', defCity).execute();
await db.insertInto('garrison').values({ city_id: defCity, unit_key: 'ranger', qty: 5 }).execute();

async function sendSiegeWave(): Promise<void> {
  for (const [unit, qty] of [
    ['berserker', 500],
    ['marshal', 1],
  ] as const) {
    await db
      .insertInto('garrison')
      .values({ city_id: atkCity, unit_key: unit, qty })
      .onConflict((oc) => oc.columns(['city_id', 'unit_key']).doUpdateSet((eb) => ({ qty: eb('garrison.qty', '+', qty) })))
      .execute();
  }
  const a = await startAttack(
    db,
    { cityId: atkCity, targetX: 101, targetY: 100, troops: { berserker: 500, marshal: 1 }, kind: 'siege' },
    t0,
  );
  await resolveDueMilitary(db, gameData, new Date(a.resolveAt.getTime() + 1000));
}

// Welle 1: 0 → 10 %.
await sendSiegeWave();
let dc = await db
  .selectFrom('cities')
  .select(['account_id', 'siege_progress'])
  .where('id', '=', defCity)
  .executeTakeFirstOrThrow();
console.log(`Nach Welle 1: progress=${dc.siege_progress} owner=${dc.account_id}`);
assert(dc.siege_progress === 10, 'Belagerung 0 → 10 %');
assert(dc.account_id === def.id, 'noch nicht erobert');

// Kurz vor dem Fall: auf 95 % setzen, eine weitere Welle → Eroberung.
await db.updateTable('cities').set({ siege_progress: 95 }).where('id', '=', defCity).execute();
await sendSiegeWave();
dc = await db
  .selectFrom('cities')
  .select(['account_id', 'siege_progress'])
  .where('id', '=', defCity)
  .executeTakeFirstOrThrow();
console.log(`Nach Eroberungs-Welle: progress=${dc.siege_progress} owner=${dc.account_id}`);
assert(dc.account_id === atk.id, 'Stadt erobert (Besitzerwechsel auf dev)');
assert(dc.siege_progress === 0, 'Belagerung nach Eroberung zurückgesetzt');

await db.destroy();
console.log('Siege-Smoke OK.');
