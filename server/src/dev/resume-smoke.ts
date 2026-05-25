/**
 * Resume-Smoke (P3 #7): belegt die Neustart-Resilienz. Verbindung A (Server-Instanz 1)
 * reiht einen Bau- und einen Trainingsauftrag ein und schliesst — der Server faehrt
 * herunter, die Jobs liegen unaufgeloest in der DB. Eine FRISCHE Verbindung B
 * (neugestarteter Server) nimmt die inzwischen ueberfaelligen Jobs beim ersten Tick
 * auf und schliesst sie ab — ganz ohne In-Memory-Zustand.
 *   (Server vorher stoppen!)  npx tsx --env-file=.env server/src/dev/resume-smoke.ts
 */
import { createDb } from '../db/connection';
import { sql } from 'kysely';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { startBuild } from '../game/build';
import { startTraining } from '../game/train';
import { resolveDueBuilds, resolveDueTraining } from '../game/scheduler';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${msg}`);
}

const gameData = loadGameData();
const t0 = new Date('2026-01-01T00:00:00Z');

// --- Server-Instanz 1: Setup + Jobs einreihen, dann herunterfahren ---
const dbA = createDb();
await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons RESTART IDENTITY CASCADE`.execute(dbA);

const account = await dbA
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@adelia.local', password_hash: 'x', gold: 5000 })
  .returning('id')
  .executeTakeFirstOrThrow();
const cityId = await foundCity(dbA, { accountId: account.id, x: 100, y: 100, seed: 12345 }, gameData, t0);

await dbA
  .updateTable('city_buildings')
  .set({ level: 4 })
  .where('city_id', '=', cityId)
  .where('building_key', '=', 'hall')
  .execute();
await dbA
  .insertInto('city_buildings')
  .values({ city_id: cityId, slot_x: 0, slot_y: 0, building_key: 'training_yard', level: 1 })
  .execute();
await dbA
  .updateTable('cities')
  .set({ timber: 5000, stone: 5000, iron: 5000, grain: 5000 })
  .where('id', '=', cityId)
  .execute();

const build = await startBuild(dbA, { cityId, slotX: 3, slotY: 3, buildingKey: 'woodcutter_lodge' }, gameData, t0);
const train = await startTraining(dbA, { cityId, unitKey: 'berserker', qty: 3 }, gameData, t0);
console.log(`Server 1: Bau (Job ${build.jobId}) + Training (Job ${train.jobId}) eingereiht.`);

await dbA.destroy();
console.log('Server 1 heruntergefahren — Jobs liegen unaufgeloest in der DB.');

// --- Server-Instanz 2: Neustart mit frischer Verbindung, loest ueberfaellige Jobs auf ---
const dbB = createDb();
const resumeAt = new Date(Math.max(build.resolveAt.getTime(), train.resolveAt.getTime()) + 60_000);
const built = await resolveDueBuilds(dbB, gameData, resumeAt);
const trained = await resolveDueTraining(dbB, resumeAt);
console.log(`Server 2 (Neustart): Tick bei ${resumeAt.toISOString()} loest Bau [${built.join(',')}] + Training [${trained.join(',')}] auf.`);

const wc = await dbB
  .selectFrom('city_buildings')
  .selectAll()
  .where('city_id', '=', cityId)
  .where('slot_x', '=', 3)
  .where('slot_y', '=', 3)
  .executeTakeFirst();
assert(wc?.building_key === 'woodcutter_lodge' && wc.level === 1, 'woodcutter_lodge L1 in Slot (3,3) gebaut');

const berserker = await dbB
  .selectFrom('garrison')
  .select(['qty'])
  .where('city_id', '=', cityId)
  .where('unit_key', '=', 'berserker')
  .executeTakeFirst();
assert(berserker?.qty === 3, '3 Berserker in der Garnison');

const openBuilds = await dbB.selectFrom('build_queue').selectAll().execute();
const openTrain = await dbB.selectFrom('training_queue').selectAll().execute();
assert(openBuilds.length === 0, 'Bau-Queue geleert');
assert(openTrain.length === 0, 'Trainings-Queue geleert');

await dbB.destroy();
console.log('Resume-Smoke OK: ueberfaellige Jobs wurden nach Neustart aufgenommen und abgeschlossen.');
