import type { Kysely } from 'kysely';
import { computeCityProduction } from '@adelia/shared/formulas/city';
import type { NodeType } from '@adelia/shared/formulas/terrain';
import type { GameData } from '@adelia/shared/schemas/data';
import type { Database } from '../db/types';
import { materializeResources } from './resources';

/**
 * Berechnet die Adjazenz/Produktion einer Stadt neu und cacht sie:
 * city_buildings.{adjacency_pct,production_h} + cities.{*_rate_h,construction_pct}.
 * Materialisiert vorher mit der ALTEN Rate; die neuen Raten gelten ab `now`.
 * Aufrufen nach jeder Layout-Änderung (Bau/Ausbau/Abriss).
 */
export async function recomputeCity(
  db: Kysely<Database>,
  cityId: number,
  gameData: GameData,
  now: Date = new Date(),
): Promise<void> {
  const tiles = await db
    .selectFrom('city_tiles')
    .select(['slot_x', 'slot_y', 'node_type'])
    .where('city_id', '=', cityId)
    .execute();
  const buildings = await db
    .selectFrom('city_buildings')
    .select(['id', 'slot_x', 'slot_y', 'building_key', 'level'])
    .where('city_id', '=', cityId)
    .execute();

  const result = computeCityProduction({
    tiles: tiles.map((t) => ({ slotX: t.slot_x, slotY: t.slot_y, nodeType: t.node_type as NodeType })),
    buildings: buildings.map((b) => ({
      slotX: b.slot_x,
      slotY: b.slot_y,
      buildingKey: b.building_key,
      level: b.level,
    })),
    buildingDefs: gameData.buildings.buildings,
    adjacency: gameData.resources.adjacency,
  });

  const bySlot = new Map(result.slots.map((s) => [`${s.slotX},${s.slotY}`, s]));
  for (const b of buildings) {
    const s = bySlot.get(`${b.slot_x},${b.slot_y}`);
    await db
      .updateTable('city_buildings')
      .set({ adjacency_pct: s?.adjacencyPct ?? 0, production_h: s?.productionH ?? 0 })
      .where('id', '=', b.id)
      .execute();
  }

  await materializeResources(db, cityId, now);
  await db
    .updateTable('cities')
    .set({
      timber_rate_h: result.ratePerH.timber,
      stone_rate_h: result.ratePerH.stone,
      iron_rate_h: result.ratePerH.iron,
      grain_rate_h: result.ratePerH.grain,
      construction_pct: result.constructionPct,
      layout_dirty: false,
    })
    .where('id', '=', cityId)
    .execute();
}
