/**
 * Map-Smoke (P3 #9): Login -> WS subscribe(map) -> 2. Stadt per REST gründen ->
 * erwarte ein map.delta mit der neuen Stadt (Region-Room-Broadcast). Voraussetzung:
 * laufender Server + frischer Seed (dev hat genau 1 Stadt).
 *   npx tsx server/src/dev/map-smoke.ts
 */
import WebSocket from 'ws';
import { decodeMessage } from '../ws/hub';

const HTTP = 'http://localhost:3000/api/v1';
const WS_URL = 'ws://localhost:3000/ws';

async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${HTTP}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login fehlgeschlagen: ${res.status}`);
  return res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0] ?? '')
    .join('; ');
}

const cookie = await login('dev', 'password123');
console.log('Login ok.');

await new Promise<void>((resolve, reject) => {
  const ws = new WebSocket(WS_URL, { headers: { Cookie: cookie } });
  const timer = setTimeout(() => {
    reject(new Error('Timeout: kein map.delta empfangen'));
  }, 6000);

  ws.on('open', () => {
    ws.send(JSON.stringify({ t: 'subscribe', channel: 'map' }));
    // kurzer Versatz, damit das Map-Abo verarbeitet ist, dann gründen
    setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`${HTTP}/cities/1/found`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', Cookie: cookie },
            body: JSON.stringify({ x: 102, y: 98 }),
          });
          const body = (await res.json()) as { cityId?: number; error?: string };
          console.log(`  POST /found -> ${res.status} ${JSON.stringify(body)}`);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      })();
    }, 300);
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(decodeMessage(raw)) as { t: string; d: unknown };
    if (msg.t === 'map.delta') {
      const { city } = msg.d as { city: { id: number; x: number; y: number; username: string } };
      console.log(`  map.delta: Stadt #${city.id} (${city.x},${city.y}) von ${city.username}`);
      clearTimeout(timer);
      ws.close();
      resolve();
    }
  });
  ws.on('error', reject);
});

console.log('Map-Smoke OK: neue Stadt kam live als map.delta an.');
process.exit(0);
