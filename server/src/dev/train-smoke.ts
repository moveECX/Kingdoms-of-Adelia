/**
 * Train-Smoke (#P2-3): Trainings-Loop gegen die echte DB.
 *   npx tsx --env-file=.env server/src/dev/train-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { startTraining } from '../game/train';
import { resolveDueTraining } from '../game/scheduler';

const db = createDb();
const gameData = loadGameData();

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons RESTART IDENTITY CASCADE`.execute(db);

const account = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@adelia.local', password_hash: 'x', gold: 5000 })
  .returning('id')
  .executeTakeFirstOrThrow();

const t0 = new Date('2026-01-01T00:00:00Z');
const cityId = await foundCity(db, { accountId: account.id, x: 100, y: 100, seed: 12345 }, gameData, t0);

// Test-Setup: Hall L4 + Training Yard L1 + Ressourcen.
await db.updateTable('city_buildings').set({ level: 4 }).where('city_id', '=', cityId).where('building_key', '=', 'hall').execute();
await db.insertInto('city_buildings').values({ city_id: cityId, slot_x: 0, slot_y: 0, building_key: 'training_yard', level: 1 }).execute();
await db.updateTable('cities').set({ timber: 2000, stone: 2000, iron: 1000 }).where('id', '=', cityId).execute();

const job = await startTraining(db, { cityId, unitKey: 'berserker', qty: 3 }, gameData, t0);
console.log(`Training: 3 Berserker, fertig ${job.resolveAt.toISOString()}`);

const after = await db.selectFrom('cities').select('iron').where('id', '=', cityId).executeTakeFirstOrThrow();
console.log(`Iron nach Start: ${after.iron} (erwartet 1000 - 3×150 = 550)`);

const changed = await resolveDueTraining(db, new Date(job.resolveAt.getTime() + 1000));
console.log(`Scheduler löste Training für Stadt: [${changed.join(', ')}]`);

const garrison = await db.selectFrom('garrison').selectAll().where('city_id', '=', cityId).execute();
for (const g of garrison) console.log(`Garrison: ${g.unit_key} × ${g.qty}`);

// Fehlerfall: Knight braucht Stable L10 (fehlt).
try {
  await startTraining(db, { cityId, unitKey: 'knight', qty: 1 }, gameData, t0);
} catch (err) {
  console.log(`erwarteter Fehler: ${err instanceof Error ? err.message : String(err)}`);
}

await db.destroy();
console.log('Train-Smoke OK.');
