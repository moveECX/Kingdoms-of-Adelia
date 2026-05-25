import type { RawData, WebSocket } from 'ws';

/** Verwaltet WS-Abonnements pro Stadt und sendet Deltas an die Subscriber. */
export class CityHub {
  private readonly byCity = new Map<number, Set<WebSocket>>();

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
    const set = this.byCity.get(cityId);
    if (set === undefined) return;
    const data = JSON.stringify(message);
    for (const socket of set) {
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
