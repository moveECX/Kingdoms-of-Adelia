/**
 * Dev-Seed (#016 / Phase 2): leert die Tabellen, legt Dev-Account + Startstadt
 * (mit Startkapital) + ein paar Dungeons an.  Aufruf: npm run seed -w server
 */
import { sql } from 'kysely';
import { createDb } from './connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { spawnDungeons } from '../game/dungeon';

const db = createDb();
const gameData = loadGameData();

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons RESTART IDENTITY CASCADE`.execute(db);

const account = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@adelia.local', password_hash: 'dev-only', gold: 5000 })
  .returning('id')
  .executeTakeFirstOrThrow();

const cityId = await foundCity(db, { accountId: account.id, x: 100, y: 100, seed: 12345 }, gameData);

// Startkapital, damit sofort gebaut/trainiert werden kann.
await db
  .updateTable('cities')
  .set({ timber: 2000, stone: 2000, iron: 1000, grain: 1000 })
  .where('id', '=', cityId)
  .execute();

await spawnDungeons(db, { x: 100, y: 100 });

console.log(`Seed: Account #${account.id} (dev), Stadt #${cityId} + Dungeons angelegt.`);
await db.destroy();
