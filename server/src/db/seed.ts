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
import { createAlliance } from '../game/alliance';

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

// Hauptspieler (Login: dev / password123) — Demo-Stadt mit Hall L8 + Schlüsselgebäuden,
// damit PvP, Markt und Endgame ohne langen Aufbau sofort testbar sind.
const dev = await createPlayer({ username: 'dev', x: 100, y: 100, seed: 12345, title: 'earl', gold: 50000 });
await db
  .updateTable('cities')
  .set({
    timber: 200000,
    stone: 200000,
    iron: 100000,
    grain: 100000,
    cap_timber: 300000,
    cap_stone: 300000,
    cap_iron: 300000,
    cap_grain: 300000,
  })
  .where('id', '=', dev.cityId)
  .execute();
await db
  .updateTable('city_buildings')
  .set({ level: 8 })
  .where('city_id', '=', dev.cityId)
  .where('building_key', '=', 'hall')
  .execute();
const devBuildings: ReadonlyArray<readonly [number, number, string, number]> = [
  [0, 1, 'training_yard', 5],
  [0, 0, 'citadel', 1],
  [1, 0, 'market', 5],
  [2, 0, 'sanctuary', 1],
  [3, 0, 'mage_tower', 1],
  [5, 0, 'stable', 5],
  [6, 0, 'warehouse', 8],
];
for (const [sx, sy, key, lvl] of devBuildings) {
  await db
    .insertInto('city_buildings')
    .values({ city_id: dev.cityId, slot_x: sx, slot_y: sy, building_key: key, level: lvl })
    .execute();
}
await recomputeCity(db, dev.cityId, gameData);
for (const [unit, qty] of [['berserker', 300], ['ranger', 150], ['marshal', 1]] as const) {
  await db.insertInto('garrison').values({ city_id: dev.cityId, unit_key: unit, qty }).execute();
}
// dev gründet eine Allianz (für Endgame/Allianz-Demo).
await createAlliance(db, dev.accountId, 'Adelische Krone', 'ADL');

// Nachbarn — fremde Städte auf der Karte; ohne Schild + mit Verteidigung für die PvP-Demo.
const aldara = await createPlayer({ username: 'aldara', x: 104, y: 101, seed: 22222, title: 'sir', gold: 1000 });
const borin = await createPlayer({ username: 'borin', x: 97, y: 103, seed: 33333, title: 'sir', gold: 1000 });
for (const c of [aldara, borin]) {
  await db
    .updateTable('cities')
    .set({ protected_until: null, timber: 8000, stone: 8000, iron: 4000, grain: 4000 })
    .where('id', '=', c.cityId)
    .execute();
  await db.insertInto('garrison').values({ city_id: c.cityId, unit_key: 'ranger', qty: 60 }).execute();
}

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
  `Seed: 3 Accounts (dev/aldara/borin, Passwort '${PASSWORD}'), dev-Stadt #${dev.cityId} (Hall L8 + Citadel/Market/Sanctuary), Allianz ADL, Dungeons + ${VIRTUES.length} Schreine.`,
);
await db.destroy();
