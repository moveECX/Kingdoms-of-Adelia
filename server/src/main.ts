/**
 * Server-Einstieg (#012/#013): Fastify-REST + WebSocket-Deltas + Tick-Scheduler.
 * Start (dev): npm run dev -w server  (lädt ../.env)
 */
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import { createDb } from './db/connection';
import { loadGameData } from './data/load-game-data';
import { startScheduler } from './game/scheduler';
import { loadCitySnapshot } from './game/snapshot';
import { CityHub, decodeMessage } from './ws/hub';
import { registerCityRoutes } from './routes/cities';

const db = createDb();
const gameData = loadGameData();
const hub = new CityHub();

const app = Fastify({ logger: true });
await app.register(websocket);

registerCityRoutes(app, { db, gameData, hub });

const subscribeMsg = z.object({
  t: z.literal('subscribe'),
  channel: z.literal('city'),
  id: z.number().int(),
});

// WS: Client sendet {t:'subscribe',channel:'city',id} → erhält city.snapshot + künftige city.delta.
app.get('/ws', { websocket: true }, (socket) => {
  socket.on('message', (raw) => {
    void (async () => {
      try {
        const msg = subscribeMsg.parse(JSON.parse(decodeMessage(raw)));
        hub.subscribe(msg.id, socket);
        socket.send(JSON.stringify({ t: 'city.snapshot', d: await loadCitySnapshot(db, msg.id) }));
      } catch {
        socket.send(JSON.stringify({ t: 'error', d: 'Ungültige Nachricht' }));
      }
    })();
  });
  socket.on('close', () => {
    hub.unsubscribeAll(socket);
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
