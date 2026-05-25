import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { loadCitySnapshot } from '../game/snapshot';
import { startBuild, BuildError } from '../game/build';
import type { CityHub } from '../ws/hub';

export interface RouteCtx {
  db: Kysely<Database>;
  gameData: GameData;
  hub: CityHub;
}

const buildBody = z.object({
  slotX: z.number().int().min(0),
  slotY: z.number().int().min(0),
  buildingKey: z.string().min(1),
});

/** Registriert die Phase-1-REST-Routen unter /api/v1. */
export function registerCityRoutes(app: FastifyInstance, ctx: RouteCtx): void {
  app.get<{ Params: { id: string } }>('/api/v1/cities/:id', async (req, reply) => {
    const snapshot = await loadCitySnapshot(ctx.db, Number(req.params.id));
    if (snapshot === null) return reply.code(404).send({ error: 'Stadt nicht gefunden' });
    return snapshot;
  });

  // Neubau (leerer Slot) oder Ausbau (belegter Slot, gleiches Gebäude).
  app.post<{ Params: { id: string } }>('/api/v1/cities/:id/build', async (req, reply) => {
    const cityId = Number(req.params.id);
    const parsed = buildBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      const job = await startBuild(ctx.db, { cityId, ...parsed.data }, ctx.gameData);
      ctx.hub.broadcast(cityId, { t: 'city.delta', d: await loadCitySnapshot(ctx.db, cityId) });
      return { jobId: job.jobId, toLevel: job.toLevel, resolveAt: job.resolveAt.toISOString() };
    } catch (err) {
      if (err instanceof BuildError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  app.get('/api/v1/data/manifest', () => ({
    buildings: ctx.gameData.buildings.schemaVersion,
    units: ctx.gameData.units.schemaVersion,
    resources: ctx.gameData.resources.schemaVersion,
    titles: ctx.gameData.titles.schemaVersion,
  }));

  // Gebäude-Definitionen für die Client-Vorschau (Kosten/Output je Stufe).
  app.get('/api/v1/data/buildings', () => ctx.gameData.buildings.buildings);

  // Auth-Stub (Phase 1): erster/einziger Account + seine Städte.
  app.get('/api/v1/me', async () => {
    const account = await ctx.db
      .selectFrom('accounts')
      .select(['id', 'username', 'title', 'gold'])
      .orderBy('id')
      .executeTakeFirst();
    if (account === undefined) return { account: null, cities: [] };
    const cities = await ctx.db
      .selectFrom('cities')
      .select(['id', 'name', 'x', 'y'])
      .where('account_id', '=', account.id)
      .orderBy('id')
      .execute();
    return { account, cities };
  });
}
