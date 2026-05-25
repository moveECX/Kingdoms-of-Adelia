import type { FastifyInstance, FastifyReply } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Database } from '../db/types';
import {
  createAlliance,
  joinAlliance,
  leaveAlliance,
  setRank,
  setDiplomacy,
  AllianceError,
} from '../game/alliance';
import { requireAccount } from '../auth/guard';

const createBody = z.object({ name: z.string().min(3).max(40), tag: z.string().min(2).max(6) });
const rankBody = z.object({ targetId: z.number().int(), rank: z.enum(['leader', 'officer', 'member']) });
const diploBody = z.object({ otherAllianceId: z.number().int(), status: z.enum(['allied', 'nap', 'enemy']) });

/** Fachliche Fehler → 400; alles andere weiterwerfen. */
function sendError(reply: FastifyReply, err: unknown): void {
  if (!(err instanceof AllianceError)) throw err;
  reply.code(400).send({ error: err.message });
}

/** Allianz-Routen unter /api/v1/alliances. */
export function registerAllianceRoutes(app: FastifyInstance, db: Kysely<Database>): void {
  app.get('/api/v1/alliances', async (req, reply) => {
    if (requireAccount(req, reply) === null) return;
    const alliances = await db.selectFrom('alliances').select(['id', 'name', 'tag', 'leader_account']).orderBy('id').execute();
    const members = await db.selectFrom('accounts').select('alliance_id').where('alliance_id', 'is not', null).execute();
    const counts = new Map<number, number>();
    for (const m of members) if (m.alliance_id !== null) counts.set(m.alliance_id, (counts.get(m.alliance_id) ?? 0) + 1);
    return { alliances: alliances.map((a) => ({ ...a, members: counts.get(a.id) ?? 0 })) };
  });

  app.get('/api/v1/alliances/mine', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    const acc = await db
      .selectFrom('accounts')
      .select(['alliance_id', 'alliance_rank'])
      .where('id', '=', accountId)
      .executeTakeFirstOrThrow();
    if (acc.alliance_id === null) return { alliance: null };
    const aid = acc.alliance_id;
    const alliance = await db
      .selectFrom('alliances')
      .select(['id', 'name', 'tag', 'leader_account'])
      .where('id', '=', aid)
      .executeTakeFirstOrThrow();
    const members = await db
      .selectFrom('accounts')
      .select(['id', 'username', 'alliance_rank'])
      .where('alliance_id', '=', aid)
      .orderBy('id')
      .execute();
    const events = await db
      .selectFrom('alliance_events')
      .select(['id', 'text', 'at'])
      .where('alliance_id', '=', aid)
      .orderBy('id', 'desc')
      .limit(30)
      .execute();
    const diplomacy = await db
      .selectFrom('alliance_diplomacy')
      .selectAll()
      .where((eb) => eb.or([eb('alliance_a', '=', aid), eb('alliance_b', '=', aid)]))
      .execute();
    return { alliance, myRank: acc.alliance_rank, members, events, diplomacy };
  });

  app.post('/api/v1/alliances', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      return { allianceId: (await createAlliance(db, accountId, parsed.data.name, parsed.data.tag)).allianceId };
    } catch (err) {
      sendError(reply, err);
    }
  });

  app.post<{ Params: { id: string } }>('/api/v1/alliances/:id/join', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    try {
      await joinAlliance(db, accountId, Number(req.params.id));
      return { ok: true };
    } catch (err) {
      sendError(reply, err);
    }
  });

  app.post('/api/v1/alliances/leave', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    try {
      await leaveAlliance(db, accountId);
      return { ok: true };
    } catch (err) {
      sendError(reply, err);
    }
  });

  app.post('/api/v1/alliances/rank', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    const parsed = rankBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      await setRank(db, accountId, parsed.data.targetId, parsed.data.rank);
      return { ok: true };
    } catch (err) {
      sendError(reply, err);
    }
  });

  app.post('/api/v1/alliances/diplomacy', async (req, reply) => {
    const accountId = requireAccount(req, reply);
    if (accountId === null) return;
    const parsed = diploBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    try {
      await setDiplomacy(db, accountId, parsed.data.otherAllianceId, parsed.data.status);
      return { ok: true };
    } catch (err) {
      sendError(reply, err);
    }
  });
}
