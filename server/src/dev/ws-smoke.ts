/**
 * WS-Smoke (#013 / Phase 3): Login -> WS mit Session-Cookie -> subscribe(city:1)
 * erwartet city.snapshot, chat.send erwartet chat.msg. Negativtest: ohne Cookie
 * darf subscribe nicht durchgehen. Voraussetzung: laufender Server + Seed.
 * Aufruf: npx tsx server/src/dev/ws-smoke.ts
 */
import WebSocket from 'ws';
import { decodeMessage } from '../ws/hub';

const HTTP = 'http://localhost:3000/api/v1';
const WS_URL = 'ws://localhost:3000/ws';

interface Msg {
  t: string;
  d: unknown;
}

async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${HTTP}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login fehlgeschlagen: ${res.status}`);
  const cookies = res.headers.getSetCookie();
  if (cookies.length === 0) throw new Error('Kein Set-Cookie erhalten');
  return cookies.map((c) => c.split(';')[0] ?? '').join('; ');
}

/** Authentifizierter Lauf: subscribe + chat müssen beide Antworten liefern. */
function runAuthed(cookie: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(WS_URL, { headers: { Cookie: cookie } });
    const seen = new Set<string>();
    const timer = setTimeout(() => { reject(new Error(`Timeout, gesehen: ${[...seen].join(',')}`)); }, 5000);
    ws.on('open', () => {
      ws.send(JSON.stringify({ t: 'subscribe', channel: 'city', id: 1 }));
      ws.send(JSON.stringify({ t: 'chat.send', text: 'Hallo Adelia!' }));
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(decodeMessage(raw)) as Msg;
      seen.add(msg.t);
      if (msg.t === 'city.snapshot') {
        const d = msg.d as { resources: { timber: { amount: number } } };
        console.log(`  city.snapshot: timber=${d.resources.timber.amount}`);
      } else if (msg.t === 'chat.msg') {
        const d = msg.d as { username: string; text: string };
        console.log(`  chat.msg: ${d.username}: ${d.text}`);
      } else if (msg.t === 'chat.history') {
        console.log(`  chat.history: ${(msg.d as unknown[]).length} Nachrichten`);
      } else if (msg.t === 'error') {
        console.log(`  error: ${String(msg.d)}`);
      }
      if (seen.has('city.snapshot') && seen.has('chat.msg')) {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    });
    ws.on('error', reject);
  });
}

/** Negativtest: ohne Cookie muss subscribe mit einer error-Nachricht abgewiesen werden. */
function runNoAuth(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timer = setTimeout(() => { reject(new Error('Timeout (no-auth)')); }, 5000);
    ws.on('open', () => { ws.send(JSON.stringify({ t: 'subscribe', channel: 'city', id: 1 })); });
    ws.on('message', (raw) => {
      const msg = JSON.parse(decodeMessage(raw)) as Msg;
      if (msg.t === 'chat.history') return; // kommt vor dem subscribe-Ergebnis
      clearTimeout(timer);
      ws.close();
      if (msg.t === 'error') {
        console.log(`  ohne Cookie subscribe -> error: ${String(msg.d)} (erwartet)`);
        resolve();
      } else {
        reject(new Error(`Unerwartete Nachricht ohne Auth: ${msg.t}`));
      }
    });
    ws.on('error', reject);
  });
}

const cookie = await login('dev', 'password123');
console.log('Login ok, Cookie erhalten.');
console.log('--- mit Auth (subscribe + chat) ---');
await runAuthed(cookie);
console.log('--- ohne Auth (subscribe) ---');
await runNoAuth();
console.log('WS-Auth+Chat-Smoke: OK');
process.exit(0);
