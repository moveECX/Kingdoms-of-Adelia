import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Database } from '../db/types';
import { buildPalace, allianceFaith, EndgameError } from '../game/endgame';
import { requireAccount, requireCityOwner } from '../auth/guard';

const palaceBody = z.object({ virtue: z.string().min(1) });

/** Endgame- & Ranglisten-Routen. */
export function registerEndgameRoutes(app: FastifyInstance, db: Kysely<Database>): void {
  // Welt-Status + Schreine + (eigene) allianzweite Faith.
  app.get('/api/v1/endgame', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    const world = await db.selectFrom('world_state').selectAll().where('id', '=', 1).executeTakeFirst();
    const shrines = await db.selectFrom('shrines').select(['id', 'x', 'y', 'virtue', 'active']).execute();
    const acc = await db.selectFrom('accounts').select('alliance_id').where('id', '=', accountId).executeTakeFirstOrThrow();
    const faith = acc.alliance_id === null ? null : await allianceFaith(db, acc.alliance_id);
    return { world: world ?? null, shrines, faith };
  });

  // Palast bauen/ausbauen (eigene Stadt, von einem aktiven Schrein erleuchtet).
  app.post<{ Params: { id: string } }>('/api/v1/cities/:id/palace', async (req, reply) => {
    const cityId = Number(req.params.id);
    if ((await requireCityOwner(db, req, reply, cityId)) === null) return;
    const parsed = palaceBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      const r = await buildPalace(db, { cityId, virtue: parsed.data.virtue }, new Date());
      return { level: r.level, victory: r.victory };
    } catch (err) {
      if (err instanceof EndgameError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  // Ranglisten: Spieler (Rangpunkte) + Allianzen (aggregierte Palast-Faith).
  app.get('/api/v1/leaderboard', async (req, reply) => {
    if (requireAccount(req, reply) === null) return;
    const players = await db
      .selectFrom('accounts')
      .select(['id', 'username', 'title', 'rank_points'])
      .orderBy('rank_points', 'desc')
      .limit(20)
      .execute();
    const allianceRows = await db.selectFrom('alliances').select(['id', 'name', 'tag']).execute();
    const palaceRows = await db
      .selectFrom('palaces')
      .innerJoin('cities', 'cities.id', 'palaces.city_id')
      .innerJoin('accounts', 'accounts.id', 'cities.account_id')
      .select(['accounts.alliance_id', 'palaces.level'])
      .where('accounts.alliance_id', 'is not', null)
      .execute();
    const faithByAlliance = new Map<number, number>();
    for (const r of palaceRows) {
      if (r.alliance_id !== null) faithByAlliance.set(r.alliance_id, (faithByAlliance.get(r.alliance_id) ?? 0) + r.level);
    }
    const alliances = allianceRows
      .map((a) => ({ ...a, faith: faithByAlliance.get(a.id) ?? 0 }))
      .sort((x, y) => y.faith - x.faith);
    return { players, alliances };
  });
}
