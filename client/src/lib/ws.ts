import type { CitySnapshot, ChatMessage, MapCity } from './types';

export interface WsHandlers {
  onCity: (snap: CitySnapshot) => void;
  onChatHistory: (msgs: ChatMessage[]) => void;
  onChatMsg: (msg: ChatMessage) => void;
  onMapDelta: (city: MapCity) => void;
}

export interface GameSocket {
  subscribeCity: (cityId: number) => void;
  subscribeMap: () => void;
  sendChat: (text: string, channel: 'global' | 'city' | 'alliance') => void;
  close: () => void;
}

/** Eine WS-Verbindung für Stadt-Snapshots/Deltas, globalen/Stadt-Chat und Karten-Deltas. */
export function connect(handlers: WsHandlers): GameSocket {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  let pendingCity: number | null = null;
  let pendingMap = false;

  const sendCitySub = (cityId: number): void => {
    ws.send(JSON.stringify({ t: 'subscribe', channel: 'city', id: cityId }));
  };
  const sendMapSub = (): void => {
    ws.send(JSON.stringify({ t: 'subscribe', channel: 'map' }));
  };

  ws.addEventListener('open', () => {
    if (pendingCity !== null) sendCitySub(pendingCity);
    if (pendingMap) sendMapSub();
  });
  ws.addEventListener('message', (ev: MessageEvent<string>) => {
    const msg = JSON.parse(ev.data) as { t: string; d: unknown };
    if (msg.t === 'city.snapshot' || msg.t === 'city.delta') handlers.onCity(msg.d as CitySnapshot);
    else if (msg.t === 'chat.history') handlers.onChatHistory(msg.d as ChatMessage[]);
    else if (msg.t === 'chat.msg') handlers.onChatMsg(msg.d as ChatMessage);
    else if (msg.t === 'map.delta') handlers.onMapDelta((msg.d as { city: MapCity }).city);
  });

  return {
    subscribeCity(cityId: number): void {
      pendingCity = cityId;
      if (ws.readyState === WebSocket.OPEN) sendCitySub(cityId);
    },
    subscribeMap(): void {
      pendingMap = true;
      if (ws.readyState === WebSocket.OPEN) sendMapSub();
    },
    sendChat(text: string, channel: 'global' | 'city' | 'alliance'): void {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: 'chat.send', channel, text }));
    },
    close(): void {
      ws.close();
    },
  };
}
