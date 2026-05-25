import type { RawData, WebSocket } from 'ws';

export interface ChatMessage {
  username: string;
  text: string;
  at: string; // ISO-Zeitstempel
}

const CHAT_HISTORY = 50;

/** Verwaltet WS-Verbindungen: Stadt-Abos (Deltas) + globaler Chat. */
export class CityHub {
  private readonly byCity = new Map<number, Set<WebSocket>>();
  private readonly clients = new Set<WebSocket>();
  private readonly chatLog: ChatMessage[] = [];

  addClient(socket: WebSocket): void {
    this.clients.add(socket);
  }

  removeClient(socket: WebSocket): void {
    this.clients.delete(socket);
    this.unsubscribeAll(socket);
  }

  subscribe(cityId: number, socket: WebSocket): void {
    let set = this.byCity.get(cityId);
    if (set === undefined) {
      set = new Set<WebSocket>();
      this.byCity.set(cityId, set);
    }
    set.add(socket);
  }

  unsubscribeAll(socket: WebSocket): void {
    for (const set of this.byCity.values()) set.delete(socket);
  }

  broadcast(cityId: number, message: unknown): void {
    this.send(this.byCity.get(cityId), message);
  }

  /** Hängt eine Chat-Nachricht an den Verlauf (max. 50) und sendet sie an alle Clients. */
  postChat(message: ChatMessage): void {
    this.chatLog.push(message);
    if (this.chatLog.length > CHAT_HISTORY) this.chatLog.shift();
    this.send(this.clients, { t: 'chat.msg', d: message });
  }

  recentChat(): readonly ChatMessage[] {
    return this.chatLog;
  }

  private send(targets: Set<WebSocket> | undefined, message: unknown): void {
    if (targets === undefined) return;
    const data = JSON.stringify(message);
    for (const socket of targets) {
      if (socket.readyState === socket.OPEN) socket.send(data);
    }
  }
}

/** Dekodiert eine ws-Nachricht robust zu einem UTF-8-String. */
export function decodeMessage(raw: RawData): string {
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}
