import type { FastifyInstance } from 'fastify';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Database } from '../db/types';
import { hashPassword, verifyPassword } from '../auth/password';
import { setSession, clearSession } from '../auth/session';

const loginBody = z.object({
  username: z.string().min(3).max(24),
  password: z.string().min(6).max(100),
});
const registerBody = loginBody.extend({ email: z.string().email() });

export function registerAuthRoutes(app: FastifyInstance, db: Kysely<Database>): void {
  app.post('/api/v1/auth/register', async (req, reply) => {
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    const existing = await db
      .selectFrom('accounts')
      .select('id')
      .where('username', '=', parsed.data.username)
      .executeTakeFirst();
    if (existing !== undefined) return reply.code(409).send({ error: 'Benutzername bereits vergeben' });

    const account = await db
      .insertInto('accounts')
      .values({
        username: parsed.data.username,
        email: parsed.data.email,
        password_hash: hashPassword(parsed.data.password),
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    setSession(reply, account.id);
    return { accountId: account.id, username: parsed.data.username };
  });

  app.post('/api/v1/auth/login', async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    const account = await db
      .selectFrom('accounts')
      .select(['id', 'password_hash'])
      .where('username', '=', parsed.data.username)
      .executeTakeFirst();
    if (account === undefined || !verifyPassword(parsed.data.password, account.password_hash)) {
      return reply.code(401).send({ error: 'Falscher Benutzername oder falsches Passwort' });
    }
    setSession(reply, account.id);
    return { accountId: account.id, username: parsed.data.username };
  });

  app.post('/api/v1/auth/logout', (request, reply) => {
    clearSession(reply);
    return { ok: true };
  });
}
