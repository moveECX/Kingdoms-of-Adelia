/**
 * Dev-Seed (#016): leert die Tabellen und legt einen Dev-Account + eine
 * Startstadt an.  Aufruf: npm run seed -w server  (lädt ../.env)
 */
import { sql } from 'kysely';
import { createDb } from './connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';

const db = createDb();
const gameData = loadGameData();

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue RESTART IDENTITY CASCADE`.execute(db);

const account = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@adelia.local', password_hash: 'dev-only' })
  .returning('id')
  .executeTakeFirstOrThrow();

const cityId = await foundCity(db, { accountId: account.id, x: 100, y: 100, seed: 12345 }, gameData);

// Startkapital, damit sofort gebaut werden kann (vgl. LoU-Startressourcen).
await db
  .updateTable('cities')
  .set({ timber: 2000, stone: 2000, iron: 1000, grain: 1000 })
  .where('id', '=', cityId)
  .execute();

console.log(`Seed: Account #${account.id} (dev), Stadt #${cityId} mit Startkapital angelegt.`);
await db.destroy();
