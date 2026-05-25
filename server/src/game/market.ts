/**
 * Spieler-Marktplatz (GAME-MECHANICS §8): Inserate bieten eine Ressourcenmenge
 * gegen Gold. Beim Erstellen wird die Menge aus der Verkäuferstadt einbehalten
 * (Escrow); bei Annahme zahlt der Käufer Gold, die Ware wird per Transfer geliefert
 * (Reisezeit nach Distanz), das Gold geht sofort an den Verkäufer.
 */
import type { Kysely, Selectable } from 'kysely';
import type { Database, MilitaryActionsTable } from '../db/types';
import { materializeResources } from './resources';
import { chebyshev, TRAVEL_SEC_PER_TILE } from './movement';

export class MarketError extends Error {}

const RESOURCES = ['timber', 'stone', 'iron', 'grain'] as const;
type ResourceKey = (typeof RESOURCES)[number];
const CAP: Record<ResourceKey, 'cap_timber' | 'cap_stone' | 'cap_iron' | 'cap_grain'> = {
  timber: 'cap_timber',
  stone: 'cap_stone',
  iron: 'cap_iron',
  grain: 'cap_grain',
};

function isResource(s: string): s is ResourceKey {
  return (RESOURCES as readonly string[]).includes(s);
}

/** Liest die (materialisierte) Ressourcenmenge einer Stadt. */
async function readResource(db: Kysely<Database>, cityId: number, resource: ResourceKey, at: Date): Promise<number> {
  await materializeResources(db, cityId, at);
  const c = await db
    .selectFrom('cities')
    .select(['timber', 'stone', 'iron', 'grain'])
    .where('id', '=', cityId)
    .executeTakeFirstOrThrow();
  return c[resource];
}

/** Schreibt einer Ressource einen Betrag gut/ab (auf 0..Cap geklemmt). */
async function adjustResource(
  db: Kysely<Database>,
  cityId: number,
  resource: ResourceKey,
  delta: number,
  at: Date,
): Promise<void> {
  await materializeResources(db, cityId, at);
  const c = await db
    .selectFrom('cities')
    .select(['timber', 'stone', 'iron', 'grain', 'cap_timber', 'cap_stone', 'cap_iron', 'cap_grain'])
    .where('id', '=', cityId)
    .executeTakeFirstOrThrow();
  const next = { timber: c.timber, stone: c.stone, iron: c.iron, grain: c.grain };
  next[resource] = Math.max(0, Math.min(c[CAP[resource]], next[resource] + delta));
  await db.updateTable('cities').set(next).where('id', '=', cityId).execute();
}

export interface CreateListingParams {
  cityId: number;
  accountId: number;
  resource: string;
  qty: number;
  wantGold: number;
}

export async function createListing(
  db: Kysely<Database>,
  params: CreateListingParams,
  now: Date = new Date(),
): Promise<{ listingId: number }> {
  if (!isResource(params.resource)) throw new MarketError('Unbekannte Ressource');
  if (params.qty <= 0 || params.wantGold < 0) throw new MarketError('Ungültige Menge oder Preis');

  const market = await db
    .selectFrom('city_buildings')
    .select('id')
    .where('city_id', '=', params.cityId)
    .where('building_key', '=', 'market')
    .executeTakeFirst();
  if (market === undefined) throw new MarketError('Inserate erfordern einen Market in der Stadt');

  const available = await readResource(db, params.cityId, params.resource, now);
  if (available < params.qty) throw new MarketError(`Nicht genug ${params.resource} (${available}/${params.qty})`);

  await adjustResource(db, params.cityId, params.resource, -params.qty, now); // Escrow
  const row = await db
    .insertInto('market_listings')
    .values({
      seller_city: params.cityId,
      seller_account: params.accountId,
      give_resource: params.resource,
      give_qty: params.qty,
      want_gold: params.wantGold,
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  return { listingId: row.id };
}

/** Zieht ein eigenes Inserat zurück; die einbehaltene Ware geht in die Stadt zurück. */
export async function cancelListing(db: Kysely<Database>, listingId: number, accountId: number): Promise<void> {
  const listing = await db
    .selectFrom('market_listings')
    .selectAll()
    .where('id', '=', listingId)
    .executeTakeFirst();
  if (listing === undefined) throw new MarketError('Inserat nicht gefunden');
  if (listing.seller_account !== accountId) throw new MarketError('Das ist nicht dein Inserat');
  if (isResource(listing.give_resource)) {
    await adjustResource(db, listing.seller_city, listing.give_resource, listing.give_qty, new Date());
  }
  await db.deleteFrom('market_listings').where('id', '=', listingId).execute();
}

export interface AcceptListingParams {
  listingId: number;
  buyerCityId: number;
  buyerAccountId: number;
}

export async function acceptListing(
  db: Kysely<Database>,
  params: AcceptListingParams,
  now: Date = new Date(),
): Promise<{ resolveAt: Date }> {
  const listing = await db
    .selectFrom('market_listings')
    .selectAll()
    .where('id', '=', params.listingId)
    .executeTakeFirst();
  if (listing === undefined) throw new MarketError('Inserat nicht gefunden');
  if (listing.seller_account === params.buyerAccountId) throw new MarketError('Du kannst dein eigenes Inserat nicht kaufen');

  const buyerCity = await db
    .selectFrom('cities')
    .select(['x', 'y', 'account_id'])
    .where('id', '=', params.buyerCityId)
    .executeTakeFirstOrThrow();
  if (buyerCity.account_id !== params.buyerAccountId) throw new MarketError('Das ist nicht deine Stadt');

  const buyer = await db
    .selectFrom('accounts')
    .select('gold')
    .where('id', '=', params.buyerAccountId)
    .executeTakeFirstOrThrow();
  if (buyer.gold < listing.want_gold) throw new MarketError(`Nicht genug Gold (${buyer.gold}/${listing.want_gold})`);

  const seller = await db
    .selectFrom('cities')
    .select(['x', 'y'])
    .where('id', '=', listing.seller_city)
    .executeTakeFirstOrThrow();

  // Gold sofort tauschen.
  await db.updateTable('accounts').set((eb) => ({ gold: eb('gold', '-', listing.want_gold) })).where('id', '=', params.buyerAccountId).execute();
  await db.updateTable('accounts').set((eb) => ({ gold: eb('gold', '+', listing.want_gold) })).where('id', '=', listing.seller_account).execute();

  // Ware per Transfer (Reisezeit nach Distanz) liefern.
  const travelSec = Math.max(1, chebyshev(seller.x, seller.y, buyerCity.x, buyerCity.y)) * TRAVEL_SEC_PER_TILE;
  const resolveAt = new Date(now.getTime() + travelSec * 1000);
  await db
    .insertInto('military_actions')
    .values({
      kind: 'transfer',
      origin_city: listing.seller_city,
      target_x: buyerCity.x,
      target_y: buyerCity.y,
      troops: JSON.stringify({}),
      cargo: JSON.stringify({ [listing.give_resource]: listing.give_qty }),
      depart_at: now,
      resolve_at: resolveAt,
      phase: 'transfer',
    })
    .execute();
  await db.deleteFrom('market_listings').where('id', '=', params.listingId).execute();
  return { resolveAt };
}

/** Liefert die Ware eines Markt-Transfers an die Zielstadt (bei Ankunft). */
export async function resolveTransfer(db: Kysely<Database>, action: Selectable<MilitaryActionsTable>): Promise<number[]> {
  const target = await db
    .selectFrom('cities')
    .select('id')
    .where('x', '=', action.target_x)
    .where('y', '=', action.target_y)
    .executeTakeFirst();
  const cargo = action.cargo ?? {};
  if (target !== undefined) {
    for (const [res, qty] of Object.entries(cargo)) {
      if (isResource(res) && qty > 0) await adjustResource(db, target.id, res, qty, action.resolve_at);
    }
  }
  await db.deleteFrom('military_actions').where('id', '=', action.id).execute();
  return target === undefined ? [] : [target.id];
}
