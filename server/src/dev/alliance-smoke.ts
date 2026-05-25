/**
 * Alliance-Smoke (P4 #6): Gründen, Beitreten, Beförderung, Diplomatie, Verlassen
 * und Event-Log. (Server vorher stoppen!)
 *   npx tsx --env-file=.env server/src/dev/alliance-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { createAlliance, joinAlliance, leaveAlliance, setRank, setDiplomacy } from '../game/alliance';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${msg}`);
}

const db = createDb();

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons, market_listings, alliances, alliance_diplomacy, alliance_events RESTART IDENTITY CASCADE`.execute(db);

const leader = await db.insertInto('accounts').values({ username: 'leader', email: 'l@a.local', password_hash: 'x' }).returning('id').executeTakeFirstOrThrow();
const member = await db.insertInto('accounts').values({ username: 'member', email: 'm@a.local', password_hash: 'x' }).returning('id').executeTakeFirstOrThrow();
const rival = await db.insertInto('accounts').values({ username: 'rival', email: 'r@a.local', password_hash: 'x' }).returning('id').executeTakeFirstOrThrow();

const { allianceId } = await createAlliance(db, leader.id, 'Drachenorden', 'DRA');
console.log(`Allianz #${allianceId} gegründet`);
const l = await db.selectFrom('accounts').select(['alliance_id', 'alliance_rank']).where('id', '=', leader.id).executeTakeFirstOrThrow();
assert(l.alliance_id === allianceId && l.alliance_rank === 'leader', 'Gründer ist Leader');

await joinAlliance(db, member.id, allianceId);
const members = await db.selectFrom('accounts').select('id').where('alliance_id', '=', allianceId).execute();
assert(members.length === 2, `2 Mitglieder (ist ${members.length})`);

await setRank(db, leader.id, member.id, 'officer');
const m1 = await db.selectFrom('accounts').select('alliance_rank').where('id', '=', member.id).executeTakeFirstOrThrow();
assert(m1.alliance_rank === 'officer', 'Mitglied zu Officer befördert');

const second = await createAlliance(db, rival.id, 'Schattenbund', 'SHA');
await setDiplomacy(db, leader.id, second.allianceId, 'enemy');
const diplo = await db.selectFrom('alliance_diplomacy').selectAll().executeTakeFirstOrThrow();
console.log(`Diplomatie: ${diplo.alliance_a} <-> ${diplo.alliance_b} = ${diplo.status}`);
assert(diplo.status === 'enemy', 'Diplomatie enemy gesetzt');

await leaveAlliance(db, member.id);
const m2 = await db.selectFrom('accounts').select('alliance_id').where('id', '=', member.id).executeTakeFirstOrThrow();
assert(m2.alliance_id === null, 'Mitglied hat die Allianz verlassen');

const events = await db.selectFrom('alliance_events').select('id').where('alliance_id', '=', allianceId).execute();
console.log(`Event-Log: ${events.length} Einträge`);
assert(events.length >= 3, 'Event-Log hat Einträge (gründen/beitreten/befördern/verlassen)');

await db.destroy();
console.log('Alliance-Smoke OK.');
