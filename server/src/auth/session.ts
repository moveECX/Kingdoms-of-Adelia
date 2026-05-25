import type { FastifyReply, FastifyRequest } from 'fastify';

const COOKIE = 'adelia_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

/** Setzt ein signiertes, httpOnly-Session-Cookie mit der Account-ID. */
export function setSession(reply: FastifyReply, accountId: number): void {
  reply.setCookie(COOKIE, String(accountId), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    signed: true,
    maxAge: MAX_AGE,
  });
}

export function clearSession(reply: FastifyReply): void {
  reply.clearCookie(COOKIE, { path: '/' });
}

/** Liest die Account-ID aus dem signierten Cookie (oder null). */
export function getAccountId(req: FastifyRequest): number | null {
  const raw = req.cookies[COOKIE];
  if (raw === undefined) return null;
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid) return null;
  const id = Number(unsigned.value);
  return Number.isInteger(id) ? id : null;
}
