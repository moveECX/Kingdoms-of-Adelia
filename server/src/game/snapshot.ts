import type { Kysely } from 'kysely';
import { deriveAmount } from '@adelia/shared/formulas/resources';
import type { Database } from '../db/types';

export interface ResourceView {
  amount: number;
  ratePerH: number;
  cap: number;
}

export interface CitySnapshot {
  id: number;
  name: string;
  x: number;
  y: number;
  resources: { timber: ResourceView; stone: ResourceView; iron: ResourceView; grain: ResourceView };
  constructionPct: number;
  tiles: Array<{ slotX: number; slotY: number; nodeType: string }>;
  buildings: Array<{
    slotX: number;
    slotY: number;
    buildingKey: string;
    level: number;
    adjacencyPct: number;
    productionH: number;
  }>;
  queue: Array<{
    jobId: number;
    slotX: number;
    slotY: number;
    buildingKey: string;
    toLevel: number;
    resolveAt: string;
  }>;
  now: string;
}

/** Vollständiger Stadt-Zustand mit live abgeleiteten Ressourcen (REST-GET + WS). */
export async function loadCitySnapshot(
  db: Kysely<Database>,
  cityId: number,
  now: Date = new Date(),
): Promise<CitySnapshot | null> {
  const c = await db.selectFrom('cities').selectAll().where('id', '=', cityId).executeTakeFirst();
  if (c === undefined) return null;

  const elapsedMs = now.getTime() - c.resources_as_of.getTime();
  const view = (amount: number, ratePerH: number, cap: number): ResourceView => ({
    amount: deriveAmount({ amount, ratePerH, cap, elapsedMs }),
    ratePerH,
    cap,
  });

  const [tiles, buildings, queue] = await Promise.all([
    db.selectFrom('city_tiles').select(['slot_x', 'slot_y', 'node_type']).where('city_id', '=', cityId).execute(),
    db
      .selectFrom('city_buildings')
      .select(['slot_x', 'slot_y', 'building_key', 'level', 'adjacency_pct', 'production_h'])
      .where('city_id', '=', cityId)
      .execute(),
    db
      .selectFrom('build_queue')
      .select(['id', 'slot_x', 'slot_y', 'building_key', 'to_level', 'resolve_at'])
      .where('city_id', '=', cityId)
      .orderBy('resolve_at')
      .execute(),
  ]);

  return {
    id: c.id,
    name: c.name,
    x: c.x,
    y: c.y,
    resources: {
      timber: view(c.timber, c.timber_rate_h, c.cap_timber),
      stone: view(c.stone, c.stone_rate_h, c.cap_stone),
      iron: view(c.iron, c.iron_rate_h, c.cap_iron),
      grain: view(c.grain, c.grain_rate_h, c.cap_grain),
    },
    constructionPct: c.construction_pct,
    tiles: tiles.map((t) => ({ slotX: t.slot_x, slotY: t.slot_y, nodeType: t.node_type })),
    buildings: buildings.map((b) => ({
      slotX: b.slot_x,
      slotY: b.slot_y,
      buildingKey: b.building_key,
      level: b.level,
      adjacencyPct: b.adjacency_pct,
      productionH: b.production_h,
    })),
    queue: queue.map((q) => ({
      jobId: q.id,
      slotX: q.slot_x,
      slotY: q.slot_y,
      buildingKey: q.building_key,
      toLevel: q.to_level,
      resolveAt: q.resolve_at.toISOString(),
    })),
    now: now.toISOString(),
  };
}
