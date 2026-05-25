import type { CitySnapshot } from './types';

/** Verbindet zum WS, abonniert eine Stadt und liefert jedes Snapshot/Delta. */
export function connectCity(cityId: number, onCity: (snap: CitySnapshot) => void): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ t: 'subscribe', channel: 'city', id: cityId }));
  });
  ws.addEventListener('message', (ev: MessageEvent<string>) => {
    const msg = JSON.parse(ev.data) as { t: string; d: CitySnapshot };
    if (msg.t === 'city.snapshot' || msg.t === 'city.delta') onCity(msg.d);
  });
  return ws;
}
