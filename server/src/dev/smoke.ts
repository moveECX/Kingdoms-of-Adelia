/**
 * Smoke-Test des Phase-1-Loops gegen die echte DB (manuell):
 *   npx tsx --env-file=.env server/src/dev/smoke.ts
 * Gründet eine Stadt, baut einen Woodcutter, lässt den Scheduler auflösen und
 * zeigt, dass Produktion + Ressourcen-Akkumulation stimmen. Leert vorher die
 * Tabellen (RESTART IDENTITY). Setzt eine laufende DB voraus.
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { startBuild } from '../game/build';
import { resolveDueBuilds } from '../game/scheduler';
import { materializeResources } from '../game/resources';

const db = createDb();
const gameData = loadGameData();

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue RESTART IDENTITY CASCADE`.execute(db);

const account = await db
  .insertInto('accounts')
  .values({ username: 'dev', email: 'dev@adelia.local', password_hash: 'x' })
  .returning('id')
  .executeTakeFirstOrThrow();

const t0 = new Date('2026-01-01T00:00:00Z');
const cityId = await foundCity(db, { accountId: account.id, x: 100, y: 100, seed: 12345 }, gameData, t0);

async function show(label: string): Promise<void> {
  const c = await db.selectFrom('cities').selectAll().where('id', '=', cityId).executeTakeFirstOrThrow();
  console.log(
    `[${label}] timber=${c.timber} (+${c.timber_rate_h}/h)  stone=${c.stone} (+${c.stone_rate_h}/h)  ` +
      `iron=${c.iron} (+${c.iron_rate_h}/h)  grain=${c.grain} (+${c.grain_rate_h}/h)  build=${c.construction_pct}%`,
  );
}

console.log(`Stadt #${cityId} gegründet (seed 12345).`);
await show('nach Gründung'); // Hall liefert +300 timber/h

// Leeren Slot mit den meisten Holz-Nachbarn wählen.
const tiles = await db
  .selectFrom('city_tiles')
  .select(['slot_x', 'slot_y', 'node_type'])
  .where('city_id', '=', cityId)
  .execute();
const nodeAt = new Map(tiles.map((t) => [`${t.slot_x},${t.slot_y}`, t.node_type]));
const OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
];
let best = { x: -1, y: -1, woods: -1 };
for (const t of tiles) {
  if (t.node_type !== 'empty' || (t.slot_x === 4 && t.slot_y === 4)) continue;
  let woods = 0;
  for (const [dx, dy] of OFFSETS) {
    if (nodeAt.get(`${t.slot_x + dx},${t.slot_y + dy}`) === 'wood') woods++;
  }
  if (woods > best.woods) best = { x: t.slot_x, y: t.slot_y, woods };
}
if (best.x < 0) throw new Error('Kein freier Slot gefunden');
console.log(`Woodcutter-Slot (${best.x},${best.y}) mit ${best.woods} Holz-Nachbarn.`);

// 1h nach Gründung bauen (Hall hat Ressourcen angesammelt).
const t1 = new Date(t0.getTime() + 3_600_000);
const job = await startBuild(
  db,
  { cityId, slotX: best.x, slotY: best.y, buildingKey: 'woodcutter_lodge' },
  gameData,
  t1,
);
console.log(`Woodcutter L${job.toLevel} in Bau; fertig ${job.resolveAt.toISOString()}.`);
await show('Bau gestartet');

// Scheduler kurz nach Fertigstellung.
const resolved = await resolveDueBuilds(db, gameData, new Date(job.resolveAt.getTime() + 1000));
console.log(`Scheduler: ${resolved.length} Auftrag/Aufträge aufgelöst.`);
await show('Woodcutter fertig');

// 2h vergehen lassen + materialisieren.
await materializeResources(db, cityId, new Date(job.resolveAt.getTime() + 2 * 3_600_000));
await show('2h später');

await db.destroy();
console.log('Smoke-Loop OK.');
