import type { BuildingDef } from '@adelia/shared/schemas/data';
import type { CitySnapshot, MapData } from './types';
import { getJson, postJson } from './api';
import { connectCity } from './ws';

interface Me {
  account: { id: number; username: string } | null;
  cities: Array<{ id: number; name: string }>;
}

export type View = 'city' | 'map' | 'military';
export interface SelectedDungeon {
  x: number;
  y: number;
  type: string;
  level: number;
  completion: number;
}

/** Globaler, reaktiver Spielzustand (Svelte 5 Runes). */
class GameStore {
  cityId = $state<number | null>(null);
  snapshot = $state<CitySnapshot | null>(null);
  buildingDefs = $state<Record<string, BuildingDef>>({});
  selected = $state<{ x: number; y: number } | null>(null);
  view = $state<View>('city');
  mapData = $state<MapData | null>(null);
  selectedDungeon = $state<SelectedDungeon | null>(null);
  error = $state<string | null>(null);

  async init(): Promise<void> {
    try {
      const me = await getJson<Me>('/me');
      const first = me.cities[0];
      if (first === undefined) {
        this.error = 'Keine Stadt gefunden — bitte `npm run seed` ausführen.';
        return;
      }
      this.cityId = first.id;
      this.buildingDefs = await getJson<Record<string, BuildingDef>>('/data/buildings');
      await this.refresh();
      connectCity(first.id, (snap) => {
        this.snapshot = snap;
      });
    } catch (err) {
      this.fail(err);
    }
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
