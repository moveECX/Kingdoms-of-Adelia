import type { CitySnapshot, ChatMessage } from './types';

export interface WsHandlers {
  onCity: (snap: CitySnapshot) => void;
  onChatHistory: (msgs: ChatMessage[]) => void;
  onChatMsg: (msg: ChatMessage) => void;
}

export interface GameSocket {
  subscribeCity: (cityId: number) => void;
  sendChat: (text: string) => void;
  close: () => void;
}

/** Eine WS-Verbindung für Stadt-Snapshots/Deltas und globalen Chat. */
export function connect(handlers: WsHandlers): GameSocket {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  let pendingCity: number | null = null;

  const subscribe = (cityId: number): void => {
    ws.send(JSON.stringify({ t: 'subscribe', channel: 'city', id: cityId }));
  };

  ws.addEventListener('open', () => {
    if (pendingCity !== null) subscribe(pendingCity);
  });
  ws.addEventListener('message', (ev: MessageEvent<string>) => {
    const msg = JSON.parse(ev.data) as { t: string; d: unknown };
    if (msg.t === 'city.snapshot' || msg.t === 'city.delta') handlers.onCity(msg.d as CitySnapshot);
    else if (msg.t === 'chat.history') handlers.onChatHistory(msg.d as ChatMessage[]);
    else if (msg.t === 'chat.msg') handlers.onChatMsg(msg.d as ChatMessage);
  });

  return {
    subscribeCity(cityId: number): void {
      pendingCity = cityId;
      if (ws.readyState === WebSocket.OPEN) subscribe(cityId);
    },
    sendChat(text: string): void {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: 'chat.send', text }));
    },
    close(): void {
      ws.close();
    },
  };
}
