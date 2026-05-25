import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { loadCitySnapshot } from '../game/snapshot';
import { startBuild, BuildError } from '../game/build';
import { startTraining, TrainError } from '../game/train';
import { startRaid, RaidError } from '../game/raid';
import { foundNewCity, FoundCityError } from '../game/found-city';
import { getAccountId } from '../auth/session';
import { requireAccount, requireCityOwner } from '../auth/guard';
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
const trainBody = z.object({ unitKey: z.string().min(1), qty: z.number().int().min(1) });
const raidBody = z.object({
  targetX: z.number().int(),
  targetY: z.number().int(),
  troops: z.record(z.string(), z.number().int().min(0)),
});
const foundBody = z.object({ x: z.number().int(), y: z.number().int() });

/** Registriert die Spiel-Routen unter /api/v1. Stadt-Aktionen erfordern Anmeldung + Besitz. */
export function registerCityRoutes(app: FastifyInstance, ctx: RouteCtx): void {
  app.get<{ Params: { id: string } }>('/api/v1/cities/:id', async (req, reply) => {
    const cityId = Number(req.params.id);
    if ((await requireCityOwner(ctx.db, req, reply, cityId)) === null) return;
    const snapshot = await loadCitySnapshot(ctx.db, cityId);
    if (snapshot === null) return reply.code(404).send({ error: 'Stadt nicht gefunden' });
    return snapshot;
  });

  // Neubau (leerer Slot) oder Ausbau (belegter Slot, gleiches Gebäude).
  app.post<{ Params: { id: string } }>('/api/v1/cities/:id/build', async (req, reply) => {
    const cityId = Number(req.params.id);
    if ((await requireCityOwner(ctx.db, req, reply, cityId)) === null) return;
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

  app.post<{ Params: { id: string } }>('/api/v1/cities/:id/train', async (req, reply) => {
    const cityId = Number(req.params.id);
    if ((await requireCityOwner(ctx.db, req, reply, cityId)) === null) return;
    const parsed = trainBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      const job = await startTraining(ctx.db, { cityId, ...parsed.data }, ctx.gameData);
      ctx.hub.broadcast(cityId, { t: 'city.delta', d: await loadCitySnapshot(ctx.db, cityId) });
      return { jobId: job.jobId, qty: job.qty, resolveAt: job.resolveAt.toISOString() };
    } catch (err) {
      if (err instanceof TrainError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  app.post<{ Params: { id: string } }>('/api/v1/cities/:id/raid', async (req, reply) => {
    const cityId = Number(req.params.id);
    if ((await requireCityOwner(ctx.db, req, reply, cityId)) === null) return;
    const parsed = raidBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      const action = await startRaid(ctx.db, { cityId, ...parsed.data }, new Date());
      ctx.hub.broadcast(cityId, { t: 'city.delta', d: await loadCitySnapshot(ctx.db, cityId) });
      return { actionId: action.actionId, resolveAt: action.resolveAt.toISOString() };
    } catch (err) {
      if (err instanceof RaidError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  app.post<{ Params: { id: string } }>('/api/v1/cities/:id/found', async (req, reply) => {
    const sourceCityId = Number(req.params.id);
    const accountId = await requireCityOwner(ctx.db, req, reply, sourceCityId);
    if (accountId === null) return;
    const parsed = foundBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      const newCityId = await foundNewCity(
        ctx.db,
        {
          accountId,
          sourceCityId,
          x: parsed.data.x,
          y: parsed.data.y,
          seed: Math.floor(Math.random() * 1_000_000_000),
        },
        ctx.gameData,
      );
      return { cityId: newCityId };
    } catch (err) {
      if (err instanceof FoundCityError) return reply.code(400).send({ error: err.message });
      throw err;
    }
  });

  // Eingeloggter Account + seine Städte (null, wenn nicht angemeldet — kein 401).
  app.get('/api/v1/me', async (req) => {
    const accountId = getAccountId(req);
    if (accountId === null) return { account: null, cities: [] };
    const account = await ctx.db
      .selectFrom('accounts')
      .select(['id', 'username', 'title', 'gold'])
      .where('id', '=', accountId)
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

  app.get('/api/v1/data/manifest', () => ({
    buildings: ctx.gameData.buildings.schemaVersion,
    units: ctx.gameData.units.schemaVersion,
    resources: ctx.gameData.resources.schemaVersion,
    titles: ctx.gameData.titles.schemaVersion,
  }));

  // Gebäude-Definitionen für die Client-Vorschau (Kosten/Output je Stufe).
  app.get('/api/v1/data/buildings', () => ctx.gameData.buildings.buildings);

  // Weltkarte: alle Städte (mit Besitzer-Name) + Dungeons. Erfordert Anmeldung.
  app.get('/api/v1/map', async (req, reply) => {
    if (requireAccount(req, reply) === null) return;
    const [cities, dungeons] = await Promise.all([
      ctx.db
        .selectFrom('cities')
        .innerJoin('accounts', 'accounts.id', 'cities.account_id')
        .select([
          'cities.id',
          'cities.name',
          'cities.x',
          'cities.y',
          'cities.account_id',
          'accounts.username',
        ])
        .execute(),
      ctx.db
        .selectFrom('dungeons')
        .select(['id', 'x', 'y', 'dungeon_type', 'level', 'completion'])
        .execute(),
    ]);
    return { cities, dungeons };
  });
}
