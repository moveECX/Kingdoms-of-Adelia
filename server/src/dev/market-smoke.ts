/**
 * Market-Smoke (P4 #5): seller bietet 1000 Timber für 500 Gold; buyer nimmt an.
 * Belegt Escrow beim Erstellen, sofortigen Gold-Tausch bei Annahme und die
 * Lieferung der Ware an die Käuferstadt nach Reisezeit.
 *   (Server vorher stoppen!)  npx tsx --env-file=.env server/src/dev/market-smoke.ts
 */
import { sql } from 'kysely';
import { createDb } from '../db/connection';
import { loadGameData } from '../data/load-game-data';
import { foundCity } from '../game/found-city';
import { createListing, acceptListing } from '../game/market';
import { resolveDueMilitary } from '../game/military';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${msg}`);
}

const db = createDb();
const gameData = loadGameData();
const t0 = new Date('2026-01-01T12:00:00Z');

await sql`TRUNCATE accounts, cities, city_tiles, city_buildings, build_queue, garrison, training_queue, military_actions, combat_reports, dungeons, market_listings RESTART IDENTITY CASCADE`.execute(db);

const seller = await db
  .insertInto('accounts')
  .values({ username: 'seller', email: 's@a.local', password_hash: 'x', gold: 0 })
  .returning('id')
  .executeTakeFirstOrThrow();
const buyer = await db
  .insertInto('accounts')
  .values({ username: 'buyer', email: 'b@a.local', password_hash: 'x', gold: 1000 })
  .returning('id')
  .executeTakeFirstOrThrow();

const sellerCity = await foundCity(db, { accountId: seller.id, x: 100, y: 100, seed: 1 }, gameData, t0);
const buyerCity = await foundCity(db, { accountId: buyer.id, x: 102, y: 100, seed: 2 }, gameData, t0);

await db
  .insertInto('city_buildings')
  .values({ city_id: sellerCity, slot_x: 0, slot_y: 0, building_key: 'market', level: 5 })
  .execute();
await db.updateTable('cities').set({ timber: 5000 }).where('id', '=', sellerCity).execute();
await db.updateTable('cities').set({ timber: 100, timber_rate_h: 0 }).where('id', '=', buyerCity).execute();

const { listingId } = await createListing(
  db,
  { cityId: sellerCity, accountId: seller.id, resource: 'timber', qty: 1000, wantGold: 500 },
  t0,
);
console.log(`Inserat #${listingId}: 1000 Timber für 500 Gold`);
const sc = await db.selectFrom('cities').select('timber').where('id', '=', sellerCity).executeTakeFirstOrThrow();
assert(sc.timber === 4000, `Escrow: Verkäufer-Timber 5000→4000 (ist ${sc.timber})`);

const { resolveAt } = await acceptListing(db, { listingId, buyerCityId: buyerCity, buyerAccountId: buyer.id }, t0);
const ba = await db.selectFrom('accounts').select('gold').where('id', '=', buyer.id).executeTakeFirstOrThrow();
const sa = await db.selectFrom('accounts').select('gold').where('id', '=', seller.id).executeTakeFirstOrThrow();
console.log(`Nach Kauf: buyer-Gold=${ba.gold} seller-Gold=${sa.gold}`);
assert(ba.gold === 500, 'Käufer zahlt 500 Gold');
assert(sa.gold === 500, 'Verkäufer erhält 500 Gold');
const gone = await db.selectFrom('market_listings').select('id').where('id', '=', listingId).executeTakeFirst();
assert(gone === undefined, 'Inserat nach Annahme entfernt');

await resolveDueMilitary(db, gameData, new Date(resolveAt.getTime() + 1000));
const bc = await db.selectFrom('cities').select('timber').where('id', '=', buyerCity).executeTakeFirstOrThrow();
console.log(`Käufer-Timber nach Lieferung: ${bc.timber}`);
assert(bc.timber === 1100, `Lieferung: Käufer-Timber 100→1100 (ist ${bc.timber})`);

await db.destroy();
console.log('Market-Smoke OK.');
