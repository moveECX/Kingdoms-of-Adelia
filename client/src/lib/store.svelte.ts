import type { BuildingDef } from '@adelia/shared/schemas/data';
import type { CitySnapshot, MapData, Account, Me, ChatMessage } from './types';
import { getJson, postJson } from './api';
import { connect, type GameSocket } from './ws';

export type View = 'city' | 'map' | 'military' | 'chat';
export interface SelectedDungeon {
  x: number;
  y: number;
  type: string;
  level: number;
  completion: number;
}

/** Globaler, reaktiver Spielzustand (Svelte 5 Runes). */
class GameStore {
  account = $state<Account | null>(null);
  authChecked = $state(false);
  chat = $state<ChatMessage[]>([]);
  cityId = $state<number | null>(null);
  snapshot = $state<CitySnapshot | null>(null);
  buildingDefs = $state<Record<string, BuildingDef>>({});
  selected = $state<{ x: number; y: number } | null>(null);
  view = $state<View>('city');
  mapData = $state<MapData | null>(null);
  selectedDungeon = $state<SelectedDungeon | null>(null);
  error = $state<string | null>(null);

  private socket: GameSocket | null = null;

  /** Beim Start: prüfen, ob bereits eine Session besteht. */
  async init(): Promise<void> {
    try {
      const me = await getJson<Me>('/me');
      this.account = me.account;
      if (me.account !== null) await this.enterGame(me);
    } catch (err) {
      this.fail(err);
    } finally {
      this.authChecked = true;
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.authenticate('/auth/login', { username, password });
  }

  async register(username: string, email: string, password: string): Promise<void> {
    await this.authenticate('/auth/register', { username, email, password });
  }

  private async authenticate(path: string, body: unknown): Promise<void> {
    try {
      await postJson(path, body);
      this.error = null;
      const me = await getJson<Me>('/me');
      this.account = me.account;
      if (me.account !== null) await this.enterGame(me);
    } catch (err) {
      this.fail(err);
    }
  }

  async logout(): Promise<void> {
    try {
      await postJson('/auth/logout', {});
    } catch (err) {
      this.fail(err);
    }
    this.socket?.close();
    this.socket = null;
    this.account = null;
    this.cityId = null;
    this.snapshot = null;
    this.mapData = null;
    this.chat = [];
    this.view = 'city';
  }

  private async enterGame(me: Me): Promise<void> {
    const first = me.cities[0];
    if (first === undefined) {
      this.error = 'Keine Stadt gefunden — bitte `npm run seed` ausführen.';
      return;
    }
    this.cityId = first.id;
    this.buildingDefs = await getJson<Record<string, BuildingDef>>('/data/buildings');
    await this.refresh();
    this.socket = connect({
      onCity: (snap) => {
        this.snapshot = snap;
      },
      onChatHistory: (msgs) => {
        this.chat = msgs;
      },
      onChatMsg: (msg) => {
        this.chat = [...this.chat, msg].slice(-100);
      },
    });
    this.socket.subscribeCity(first.id);
  }

  sendChat(text: string): void {
    const trimmed = text.trim();
    if (trimmed.length > 0) this.socket?.sendChat(trimmed);
  }

  private fail(err: unknown): void {
    this.error = err instanceof Error ? err.message : String(err);
  }

  async refresh(): Promise<void> {
    if (this.cityId === null) return;
    this.snapshot = await getJson<CitySnapshot>(`/cities/${this.cityId}`);
  }

  async setView(view: View): Promise<void> {
    this.view = view;
    if (view === 'map') await this.loadMap();
  }

  async loadMap(): Promise<void> {
    try {
      this.mapData = await getJson<MapData>('/map');
    } catch (err) {
      this.fail(err);
    }
  }

  select(x: number, y: number): void {
    this.selected = { x, y };
  }

  selectDungeon(d: SelectedDungeon): void {
    this.selectedDungeon = d;
    this.view = 'military';
  }

  async build(buildingKey: string): Promise<void> {
    if (this.cityId === null || this.selected === null) return;
    await this.post(`/cities/${this.cityId}/build`, {
      slotX: this.selected.x,
      slotY: this.selected.y,
      buildingKey,
    });
  }

  async train(unitKey: string, qty: number): Promise<void> {
    if (this.cityId === null) return;
    await this.post(`/cities/${this.cityId}/train`, { unitKey, qty });
  }

  async raid(troops: Record<string, number>): Promise<void> {
    if (this.cityId === null || this.selectedDungeon === null) return;
    await this.post(`/cities/${this.cityId}/raid`, {
      targetX: this.selectedDungeon.x,
      targetY: this.selectedDungeon.y,
      troops,
    });
  }

  async found(x: number, y: number): Promise<void> {
    if (this.cityId === null) return;
    await this.post(`/cities/${this.cityId}/found`, { x, y });
    await this.loadMap();
  }

  private async post(path: string, body: unknown): Promise<void> {
    try {
      await postJson(path, body);
      this.error = null;
      await this.refresh(); // sofortige Aktualisierung (zusätzlich zum WS-Delta)
    } catch (err) {
      this.fail(err);
    }
  }
}

export const game = new GameStore();
