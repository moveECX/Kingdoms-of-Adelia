/**
 * WS-Smoke (#013): abonniert city:1 und erwartet eine city.snapshot-Nachricht.
 * Voraussetzung: laufender Server.  Aufruf: npx tsx server/src/dev/ws-smoke.ts
 */
import WebSocket from 'ws';
import { decodeMessage } from '../ws/hub';

interface SnapshotMsg {
  t: string;
  d: { resources: { timber: { amount: number } }; buildings: unknown[]; queue: unknown[] };
}

const ws = new WebSocket('ws://localhost:3000/ws');
const timer = setTimeout(() => {
  console.error('Timeout: keine WS-Antwort');
  process.exit(1);
}, 5000);

ws.on('open', () => {
  ws.send(JSON.stringify({ t: 'subscribe', channel: 'city', id: 1 }));
});
ws.on('message', (raw) => {
  clearTimeout(timer);
  const msg = JSON.parse(decodeMessage(raw)) as SnapshotMsg;
  console.log(
    `WS: t=${msg.t}  timber=${msg.d.resources.timber.amount}  buildings=${msg.d.buildings.length}  queue=${msg.d.queue.length}`,
  );
  ws.close();
  process.exit(0);
});
ws.on('error', (err: unknown) => {
  console.error('WS-Fehler:', err);
  process.exit(1);
});
