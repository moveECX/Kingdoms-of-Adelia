/**
 * Endgame-Smoke (P5 #1): eine Allianz baut in 8 erleuchteten Städten je einen
 * L10-Palast (sieben direkt gesetzt, der achte per buildPalace ausgebaut) und
 * löst damit den Sieg aus → die Welt endet, Champion ist die Allianz.
 *   (Server vorher stoppen!)  npx tsx --env-file=.env server/src/dev/endgame-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { buildPalace } from '../game/endgame';
import { VIRTUES, MAX_PALACE_LEVEL } from '@adelia/shared/constants/game';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${msg}`);
}

const db = createDb();
const gameData = loadGameData();
const t0 = new Date('2026-01-01T12:00:00Z');

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons, market_listings, alliances, alliance_diplomacy, alliance_events, shrines, palaces, world_state RESTART IDENTITY CASCADE`.execute(db);
await sql`INSERT INTO world_state (id, ended) VALUES (1, false)`.execute(db);

const acc = await db.insertInto('accounts').values({ username: 'champion', email: 'c@a.local', password_hash: 'x' }).returning('id').executeTakeFirstOrThrow();
const alliance = await db.insertInto('alliances').values({ name: 'Sieger', tag: 'WIN', leader_account: acc.id }).returning('id').executeTakeFirstOrThrow();
await db.updateTable('accounts').set({ alliance_id: alliance.id, alliance_rank: 'leader' }).where('id', '=', acc.id).execute();

// Je Tugend ein aktiver Schrein + eine direkt daneben gegründete Stadt.
const cityByVirtue = new Map<string, number>();
for (const [i, virtue] of VIRTUES.entries()) {
  const sx = 200;
  const sy = 100 + i;
  await db.insertInto('shrines').values({ x: sx, y: sy, virtue, active: true }).execute();
  cityByVirtue.set(virtue, await foundCity(db, { accountId: acc.id, x: sx + 1, y: sy, seed: 1000 + i }, gameData, t0));
}

// Sieben Tugenden: Palast direkt auf L10.
for (const virtue of VIRTUES.slice(0, -1)) {
  const cid = cityByVirtue.get(virtue);
  if (cid !== undefined) {
    await db.insertInto('palaces').values({ city_id: cid, virtue, level: MAX_PALACE_LEVEL }).execute();
  }
}

// Achte Tugend: per buildPalace von L1 auf L10 (testet Gating + Level-up + Sieg-Trigger).
const lastVirtue = VIRTUES[VIRTUES.length - 1];
const lastCity = lastVirtue === undefined ? undefined : cityByVirtue.get(lastVirtue);
if (lastVirtue === undefined || lastCity === undefined) throw new Error('Setup fehlgeschlagen');

let result = { level: 0, victory: false };
for (let lvl = 1; lvl <= MAX_PALACE_LEVEL; lvl++) {
  result = await buildPalace(db, { cityId: lastCity, virtue: lastVirtue }, t0);
}
console.log(`Letzter Palast (${lastVirtue}) auf L${result.level}, victory=${String(result.victory)}`);
assert(result.level === MAX_PALACE_LEVEL, 'Palast auf L10 ausgebaut');
assert(result.victory, 'Sieg ausgelöst (L10-Palast aller 8 Tugenden)');

const world = await db.selectFrom('world_state').selectAll().where('id', '=', 1).executeTakeFirstOrThrow();
console.log(`Welt: ended=${String(world.ended)} champion=${String(world.champion_alliance)}`);
assert(world.ended, 'Welt beendet');
assert(world.champion_alliance === alliance.id, 'Champion = Sieger-Allianz');

let blocked = false;
try {
  await buildPalace(db, { cityId: lastCity, virtue: lastVirtue }, t0);
} catch {
  blocked = true;
}
assert(blocked, 'Bau nach Spielende abgewiesen');

await db.destroy();
console.log('Endgame-Smoke OK.');
