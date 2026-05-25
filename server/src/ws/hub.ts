import type { RawData, WebSocket } from 'ws';

export interface ChatMessage {
  channel: 'global' | 'city' | 'alliance';
  cityId?: number; // gesetzt bei channel === 'city'
  username: string;
  text: string;
  at: string; // ISO-Zeitstempel
}

const CHAT_HISTORY = 50;

/** Verwaltet WS-Verbindungen: Stadt-Abos (Deltas) + Chat (global & pro Stadt). */
export class CityHub {
  private readonly byCity = new Map<number, Set<WebSocket>>();
  private readonly clients = new Set<WebSocket>();
  private readonly mapClients = new Set<WebSocket>();
  private readonly accountBySocket = new Map<WebSocket, number>();
  private readonly chatLog: ChatMessage[] = [];

  addClient(socket: WebSocket, accountId: number | null): void {
    this.clients.add(socket);
    if (accountId !== null) this.accountBySocket.set(socket, accountId);
  }

  removeClient(socket: WebSocket): void {
    this.clients.delete(socket);
    this.mapClients.delete(socket);
    this.accountBySocket.delete(socket);
    this.unsubscribeAll(socket);
  }

  /** Sendet an alle Sockets, deren Account in der Menge ist (z. B. Allianz-Chat). */
  broadcastToAccounts(accountIds: ReadonlySet<number>, message: unknown): void {
    const data = JSON.stringify(message);
    for (const socket of this.clients) {
      const acc = this.accountBySocket.get(socket);
      if (acc !== undefined && accountIds.has(acc) && socket.readyState === socket.OPEN) socket.send(data);
    }
  }

  /** Abonniert die Weltkarte (erhält künftige map.delta-Broadcasts). */
  subscribeMap(socket: WebSocket): void {
    this.mapClients.add(socket);
  }

  /** Karten-Delta an alle Karten-Abonnenten (z. B. eine neu gegründete Stadt). */
  broadcastMap(message: unknown): void {
    this.send(this.mapClients, message);
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

  /** Städte, die dieser Socket abonniert hat (Ziel für den Stadt-Chat des Senders). */
  citiesFor(socket: WebSocket): number[] {
    const ids: number[] = [];
    for (const [cityId, set] of this.byCity) if (set.has(socket)) ids.push(cityId);
    return ids;
  }

  broadcast(cityId: number, message: unknown): void {
    this.send(this.byCity.get(cityId), message);
  }

  /** Globaler Chat: Verlauf (max. 50) + Broadcast an alle Clients. */
  postGlobalChat(message: ChatMessage): void {
    this.chatLog.push(message);
    if (this.chatLog.length > CHAT_HISTORY) this.chatLog.shift();
    this.send(this.clients, { t: 'chat.msg', d: message });
  }

  /** Stadt-Chat: Broadcast nur an die Abonnenten dieser Stadt (kein globaler Verlauf). */
  postCityChat(cityId: number, message: ChatMessage): void {
    this.send(this.byCity.get(cityId), { t: 'chat.msg', d: message });
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
