/**
 * Dev-Seed (#016 / Phase 2+3): leert die Tabellen und legt mehrere Accounts an,
 * jeder mit Login (Passwort 'password123') und einer Stadt. 'dev' bekommt zusätzlich
 * Startkapital + Hall L4 + Training Yard für die Demo. Aufruf: npm run seed -w server
 */
import { sql } from 'kysely';
import { createDb } from './connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { recomputeCity } from '../game/recompute';
import { spawnDungeons } from '../game/dungeon';
import { hashPassword } from '../auth/password';
import { VIRTUES } from '@adelia/shared/constants/game';

const db = createDb();
const gameData = loadGameData();

const PASSWORD = 'password123';

async function createPlayer(opts: {
  username: string;
  x: number;
  y: number;
  seed: number;
  title: string;
  gold: number;
}): Promise<{ accountId: number; cityId: number }> {
  const account = await db
    .insertInto('accounts')
    .values({
      username: opts.username,
      email: `${opts.username}@adelia.local`,
      password_hash: hashPassword(PASSWORD),
      title: opts.title,
      gold: opts.gold,
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  const cityId = await foundCity(
    db,
    { accountId: account.id, x: opts.x, y: opts.y, seed: opts.seed },
    gameData,
  );
  return { accountId: account.id, cityId };
}

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons, market_listings, alliances, alliance_diplomacy, alliance_events, shrines, palaces, world_state RESTART IDENTITY CASCADE`.execute(db);
await sql`INSERT INTO world_state (id, ended) VALUES (1, false)`.execute(db);

// Hauptspieler (Login: dev / password123) — mit Startkapital für die Demo.
const dev = await createPlayer({ username: 'dev', x: 100, y: 100, seed: 12345, title: 'earl', gold: 5000 });
await db
  .updateTable('cities')
  .set({ timber: 2000, stone: 2000, iron: 1000, grain: 1000 })
  .where('id', '=', dev.cityId)
  .execute();
await db
  .updateTable('city_buildings')
  .set({ level: 4 })
  .where('city_id', '=', dev.cityId)
  .where('building_key', '=', 'hall')
  .execute();
await db
  .insertInto('city_buildings')
  .values({ city_id: dev.cityId, slot_x: 0, slot_y: 1, building_key: 'training_yard', level: 1 })
  .execute();
await recomputeCity(db, dev.cityId, gameData);

// Nachbarn — erscheinen als fremde Städte auf der Weltkarte.
await createPlayer({ username: 'aldara', x: 104, y: 101, seed: 22222, title: 'sir', gold: 1000 });
await createPlayer({ username: 'borin', x: 97, y: 103, seed: 33333, title: 'sir', gold: 1000 });

await spawnDungeons(db, { x: 100, y: 100 });

// Acht Schreine (je eine Tugend, aktiv) rund um die Startregion — erleuchten nahe Allianzstädte.
const SHRINE_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [100, 90],
  [110, 92],
  [115, 100],
  [110, 108],
  [100, 110],
  [90, 108],
  [85, 100],
  [90, 92],
];
await db
  .insertInto('shrines')
  .values(
    VIRTUES.map((virtue, i) => {
      const pos = SHRINE_POSITIONS[i] ?? [100, 100];
      return { x: pos[0], y: pos[1], virtue, active: true };
    }),
  )
  .execute();

console.log(
  `Seed: 3 Accounts (dev/aldara/borin, Passwort '${PASSWORD}'), dev-Stadt #${dev.cityId} + Dungeons + ${VIRTUES.length} Schreine.`,
);
await db.destroy();
