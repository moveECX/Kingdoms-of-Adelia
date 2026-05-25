/**
 * Raid-Smoke (#P2-4): kompletter Raid-Loop gegen die echte DB.
 *   npx tsx --env-file=.env server/src/dev/raid-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { spawnDungeons } from '../game/dungeon';
import { startRaid } from '../game/raid';
import { resolveDueMilitary } from '../game/military';

const db = createDb();
const gameData = loadGameData();

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons RESTART IDENTITY CASCADE`.execute(db);

const account = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@adelia.local', password_hash: 'x' })
  .returning('id')
  .executeTakeFirstOrThrow();
const t0 = new Date('2026-01-01T00:00:00Z');
const cityId = await foundCity(db, { accountId: account.id, x: 100, y: 100, seed: 12345 }, gameData, t0);
await spawnDungeons(db, { x: 100, y: 100 });
await db.insertInto('garrison').values({ city_id: cityId, unit_key: 'berserker', qty: 60 }).execute();

const dungeon = await db.selectFrom('dungeons').selectAll().where('level', '=', 1).orderBy('id').executeTakeFirstOrThrow();
console.log(`Dungeon ${dungeon.dungeon_type} L${dungeon.level} @ (${dungeon.x},${dungeon.y})`);

const raid = await startRaid(db, { cityId, targetX: dungeon.x, targetY: dungeon.y, troops: { berserker: 40 } }, t0);
const g0 = await db.selectFrom('garrison').select('qty').where('city_id', '=', cityId).where('unit_key', '=', 'berserker').executeTakeFirstOrThrow();
console.log(`Raid: 40 Berserker; Garnison daheim ${g0.qty} (60-40); Ankunft ${raid.resolveAt.toISOString()}`);

// Ankunft → Kampf.
await resolveDueMilitary(db, gameData, new Date(raid.resolveAt.getTime() + 1000));
const report = await db.selectFrom('combat_reports').selectAll().orderBy('id', 'desc').executeTakeFirst();
console.log(`Kampfbericht: ${JSON.stringify(report?.detail)}`);
const dAfter = await db.selectFrom('dungeons').select('completion').where('id', '=', dungeon.id).executeTakeFirstOrThrow();
console.log(`Dungeon-Fortschritt: ${dAfter.completion}%`);

// Rückkehr.
const action = await db.selectFrom('military_actions').selectAll().executeTakeFirst();
if (action !== undefined) {
  console.log(`Rückkehr: phase=${action.phase}, cargo=${JSON.stringify(action.cargo)}, fällig ${action.resolve_at.toISOString()}`);
  await resolveDueMilitary(db, gameData, new Date(action.resolve_at.getTime() + 1000));
}

const gBack = await db.selectFrom('garrison').select('qty').where('city_id', '=', cityId).where('unit_key', '=', 'berserker').executeTakeFirst();
const city = await db.selectFrom('cities').select(['timber', 'iron']).where('id', '=', cityId).executeTakeFirstOrThrow();
console.log(`Nach Rückkehr: Berserker-Garnison ${gBack?.qty ?? 0}; Stadt timber=${city.timber} iron=${city.iron}`);
console.log(`Offene Bewegungen: ${(await db.selectFrom('military_actions').selectAll().execute()).length}`);

await db.destroy();
console.log('Raid-Smoke OK.');
