import type { BuildingDef } from '@adelia/shared/schemas/data';
import type { CitySnapshot } from './types';
import { getJson, postJson } from './api';
import { connectCity } from './ws';

interface Me {
  account: { id: number; username: string } | null;
  cities: Array<{ id: number; name: string }>;
}

/** Globaler, reaktiver Spielzustand (Svelte 5 Runes). */
class GameStore {
  cityId = $state<number | null>(null);
  snapshot = $state<CitySnapshot | null>(null);
  buildingDefs = $state<Record<string, BuildingDef>>({});
  selected = $state<{ x: number; y: number } | null>(null);
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
      this.snapshot = await getJson<CitySnapshot>(`/cities/${first.id}`);
      connectCity(first.id, (snap) => {
        this.snapshot = snap;
      });
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    }
  }

  select(x: number, y: number): void {
    this.selected = { x, y };
  }

  async build(buildingKey: string): Promise<void> {
    if (this.cityId === null || this.selected === null) return;
    try {
      await postJson(`/cities/${this.cityId}/build`, {
        slotX: this.selected.x,
        slotY: this.selected.y,
        buildingKey,
      });
      this.error = null; // Aktualisierung folgt per WS-Delta
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    }
  }
}

export const game = new GameStore();
