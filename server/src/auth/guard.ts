import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../db/types';
import { getAccountId } from './session';

/** Account-ID aus der Session oder 401. Gibt null zurück, wenn bereits 401 gesendet wurde. */
export function requireAccount(req: FastifyRequest, reply: FastifyReply): number | null {
  const accountId = getAccountId(req);
  if (accountId === null) {
    reply.code(401).send({ error: 'Nicht angemeldet' });
    return null;
  }
  return accountId;
}

/**
 * Prüft Anmeldung + Besitz der Stadt. Sendet 401/403/404 selbst und gibt dann null zurück.
 * Bei Erfolg die Account-ID des eingeloggten Besitzers.
 */
export async function requireCityOwner(
  db: Kysely<Database>,
  req: FastifyRequest,
  reply: FastifyReply,
  cityId: number,
): Promise<number | null> {
  const accountId = requireAccount(req, reply);
  if (accountId === null) return null;
  const city = await db
    .selectFrom('cities')
    .select('account_id')
    .where('id', '=', cityId)
    .executeTakeFirst();
  if (city === undefined) {
    reply.code(404).send({ error: 'Stadt nicht gefunden' });
    return null;
  }
  if (city.account_id !== accountId) {
    reply.code(403).send({ error: 'Das ist nicht deine Stadt' });
    return null;
  }
  return accountId;
}
