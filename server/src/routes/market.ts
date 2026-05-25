import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Database } from '../db/types';
import { createListing, acceptListing, cancelListing, MarketError } from '../game/market';
import { requireAccount, requireCityOwner } from '../auth/guard';

const listBody = z.object({
  cityId: z.number().int(),
  resource: z.enum(['timber', 'stone', 'iron', 'grain']),
  qty: z.number().int().min(1),
  wantGold: z.number().int().min(0),
});
const acceptBody = z.object({ buyerCityId: z.number().int() });

/** Marktplatz-Routen unter /api/v1/market. */
export function registerMarketRoutes(app: FastifyInstance, db: Kysely<Database>): void {
  // Offene Inserate (mit Verkäufer-Name).
  app.get('/api/v1/market', async (req, reply) => {
    if (requireAccount(req, reply) === null) return;
    const listings = await db
      .selectFrom('market_listings')
      .innerJoin('accounts', 'accounts.id', 'market_listings.seller_account')
      .select([
        'market_listings.id',
        'give_resource',
        'give_qty',
        'want_gold',
        'seller_account',
        'accounts.username',
        'created_at',
      ])
      .orderBy('market_listings.id', 'desc')
      .execute();
    return { listings };
  });

  // Inserat erstellen (für eine eigene Stadt mit Market).
  app.post('/api/v1/market/list', async (req, reply) => {
    const parsed = listBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    const accountId = await requireCityOwner(db, req, reply, parsed.data.cityId);
    if (accountId === null) return;
    try {
      const r = await createListing(db, { accountId, ...parsed.data }, new Date());
      return { listingId: r.listingId };
    } catch (err) {
      if (err instanceof MarketError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  // Inserat annehmen (Lieferung an eine eigene Stadt).
  app.post<{ Params: { id: string } }>('/api/v1/market/:id/accept', async (req, reply) => {
    const parsed = acceptBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    const accountId = await requireCityOwner(db, req, reply, parsed.data.buyerCityId);
    if (accountId === null) return;
    try {
      const r = await acceptListing(
        db,
        { listingId: Number(req.params.id), buyerCityId: parsed.data.buyerCityId, buyerAccountId: accountId },
        new Date(),
      );
      return { resolveAt: r.resolveAt.toISOString() };
    } catch (err) {
      if (err instanceof MarketError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  // Eigenes Inserat zurückziehen (Ware geht in die Stadt zurück).
  app.delete<{ Params: { id: string } }>('/api/v1/market/:id', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    try {
      await cancelListing(db, Number(req.params.id), accountId);
      return { ok: true };
    } catch (err) {
      if (err instanceof MarketError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });
}
