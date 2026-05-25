import type { BuildingDef } from '@adelia/shared/schemas/data';
import type { CitySnapshot, MapData, MapCity, Account, Me, ChatMessage, CombatReport, MarketListing } from './types';
import { getJson, postJson, deleteJson } from './api';
import { connect, type GameSocket } from './ws';

export type View = 'city' | 'map' | 'military' | 'chat' | 'reports' | 'market';
export type AttackKind = 'scout' | 'plunder' | 'assault' | 'siege';
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
  chatGlobal = $state<ChatMessage[]>([]);
  chatCity = $state<ChatMessage[]>([]);
  cityId = $state<number | null>(null);
  snapshot = $state<CitySnapshot | null>(null);
  buildingDefs = $state<Record<string, BuildingDef>>({});
  selected = $state<{ x: number; y: number } | null>(null);
  view = $state<View>('city');
  mapData = $state<MapData | null>(null);
  selectedDungeon = $state<SelectedDungeon | null>(null);
  selectedTarget = $state<MapCity | null>(null);
  reports = $state<CombatReport[]>([]);
  market = $state<MarketListing[]>([]);
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
    this.chatGlobal = [];
    this.chatCity = [];
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
        this.chatGlobal = msgs;
      },
      onChatMsg: (msg) => {
        if (msg.channel === 'city') this.chatCity = [...this.chatCity, msg].slice(-100);
        else this.chatGlobal = [...this.chatGlobal, msg].slice(-100);
      },
      onMapDelta: (city) => {
        this.addMapCity(city);
      },
    });
    this.socket.subscribeCity(first.id);
    this.socket.subscribeMap();
  }

  sendChat(text: string, channel: 'global' | 'city' = 'global'): void {
    const trimmed = text.trim();
    if (trimmed.length > 0) this.socket?.sendChat(trimmed, channel);
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
    else if (view === 'reports') await this.loadReports();
    else if (view === 'market') await this.loadMarket();
  }

  async loadMap(): Promise<void> {
    try {
      this.mapData = await getJson<MapData>('/map');
    } catch (err) {
      this.fail(err);
    }
  }

  /** Fügt eine per WS gemeldete neue Stadt zur Karte hinzu (falls bereits geladen). */
  private addMapCity(city: MapCity): void {
    if (this.mapData === null) return;
    if (this.mapData.cities.some((c) => c.id === city.id)) return;
    this.mapData = { ...this.mapData, cities: [...this.mapData.cities, city] };
  }

  select(x: number, y: number): void {
    this.selected = { x, y };
  }

  selectDungeon(d: SelectedDungeon): void {
    this.selectedDungeon = d;
    this.selectedTarget = null;
    this.view = 'military';
  }

  selectTarget(city: MapCity): void {
    this.selectedTarget = city;
    this.selectedDungeon = null;
    this.view = 'military';
  }

  async attack(kind: AttackKind, troops: Record<string, number>): Promise<void> {
    if (this.cityId === null || this.selectedTarget === null) return;
    await this.post(`/cities/${this.cityId}/attack`, {
      targetX: this.selectedTarget.x,
      targetY: this.selectedTarget.y,
      troops,
      kind,
    });
  }

  async loadReports(): Promise<void> {
    try {
      const data = await getJson<{ reports: CombatReport[] }>('/reports');
      this.reports = data.reports;
    } catch (err) {
      this.fail(err);
    }
  }

  async loadMarket(): Promise<void> {
    try {
      this.market = (await getJson<{ listings: MarketListing[] }>('/market')).listings;
    } catch (err) {
      this.fail(err);
    }
  }

  async createListing(resource: string, qty: number, wantGold: number): Promise<void> {
    if (this.cityId === null) return;
    try {
      await postJson('/market/list', { cityId: this.cityId, resource, qty, wantGold });
      this.error = null;
      await this.refresh();
      await this.loadMarket();
    } catch (err) {
      this.fail(err);
    }
  }

  async acceptListing(id: number): Promise<void> {
    if (this.cityId === null) return;
    try {
      await postJson(`/market/${id}/accept`, { buyerCityId: this.cityId });
      this.error = null;
      await this.refresh();
      await this.loadMarket();
    } catch (err) {
      this.fail(err);
    }
  }

  async cancelListing(id: number): Promise<void> {
    try {
      await deleteJson(`/market/${id}`);
      await this.refresh();
      await this.loadMarket();
    } catch (err) {
      this.fail(err);
    }
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
