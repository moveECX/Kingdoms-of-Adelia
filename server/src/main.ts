/**
 * Server-Einstieg (#012/#013): Fastify-REST + WebSocket-Deltas + Tick-Scheduler.
 * Start (dev): npm run dev -w server  (lädt ../.env)
 */
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import { createDb } from './db/connection';
import { loadGameData } from './data/load-game-data';
import { startScheduler } from './game/scheduler';
import { loadCitySnapshot } from './game/snapshot';
import { CityHub, decodeMessage } from './ws/hub';
import { registerCityRoutes } from './routes/cities';
import { registerAuthRoutes } from './routes/auth';
import { registerMarketRoutes } from './routes/market';
import { getAccountId } from './auth/session';

const db = createDb();
const gameData = loadGameData();
const hub = new CityHub();

const app = Fastify({ logger: true });
await app.register(websocket);
await app.register(cookie, { secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me' });
// global:false → Limit gilt nur für Routen, die es per config.rateLimit anfordern (auth/*).
await app.register(rateLimit, { global: false });

registerAuthRoutes(app, db);
registerCityRoutes(app, { db, gameData, hub });
registerMarketRoutes(app, db);

const clientMsg = z.discriminatedUnion('t', [
  z.object({ t: z.literal('subscribe'), channel: z.enum(['city', 'map']), id: z.number().int().optional() }),
  z.object({
    t: z.literal('chat.send'),
    channel: z.enum(['global', 'city']).default('global'),
    text: z.string().trim().min(1).max(500),
  }),
]);

// WS: subscribe → city.snapshot + künftige city.delta (nur eigene Stadt); chat.send → chat.msg an alle.
app.get('/ws', { websocket: true }, (socket, req) => {
  hub.addClient(socket);
  socket.send(JSON.stringify({ t: 'chat.history', d: hub.recentChat() }));
  socket.on('message', (raw) => {
    void (async () => {
      try {
        const msg = clientMsg.parse(JSON.parse(decodeMessage(raw)));
        const accountId = getAccountId(req);
        if (accountId === null) {
          socket.send(JSON.stringify({ t: 'error', d: 'Nicht angemeldet' }));
          return;
        }
        if (msg.t === 'subscribe') {
          if (msg.channel === 'map') {
            hub.subscribeMap(socket);
            return;
          }
          if (msg.id === undefined) {
            socket.send(JSON.stringify({ t: 'error', d: 'Stadt-ID fehlt' }));
            return;
          }
          const city = await db
            .selectFrom('cities')
            .select('account_id')
            .where('id', '=', msg.id)
            .executeTakeFirst();
          if (city === undefined || city.account_id !== accountId) {
            socket.send(JSON.stringify({ t: 'error', d: 'Kein Zugriff auf diese Stadt' }));
            return;
          }
          hub.subscribe(msg.id, socket);
          socket.send(JSON.stringify({ t: 'city.snapshot', d: await loadCitySnapshot(db, msg.id) }));
        } else {
          const acc = await db
            .selectFrom('accounts')
            .select('username')
            .where('id', '=', accountId)
            .executeTakeFirst();
          if (acc === undefined) return;
          const at = new Date().toISOString();
          if (msg.channel === 'global') {
            hub.postGlobalChat({ channel: 'global', username: acc.username, text: msg.text, at });
          } else {
            // Stadt-Chat geht an die Abonnenten jeder vom Sender abonnierten Stadt.
            for (const cityId of hub.citiesFor(socket)) {
              hub.postCityChat(cityId, { channel: 'city', cityId, username: acc.username, text: msg.text, at });
            }
          }
        }
      } catch {
        socket.send(JSON.stringify({ t: 'error', d: 'Ungültige Nachricht' }));
      }
    })();
  });
  socket.on('close', () => {
    hub.removeClient(socket);
  });
});

const scheduler = startScheduler(db, gameData, (cityId) => {
  void (async () => {
    hub.broadcast(cityId, { t: 'city.delta', d: await loadCitySnapshot(db, cityId) });
  })();
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: '0.0.0.0' });

process.on('SIGINT', () => {
  clearInterval(scheduler);
  void app.close().then(() => db.destroy());
});
