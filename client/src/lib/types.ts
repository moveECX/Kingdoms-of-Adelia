/** Client-Spiegel des Server-Snapshots (server/src/game/snapshot.ts). */
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
  garrison: Array<{ unitKey: string; qty: number }>;
  now: string;
}

export interface MapData {
  cities: Array<{ id: number; name: string; x: number; y: number; account_id: number }>;
  dungeons: Array<{ id: number; x: number; y: number; dungeon_type: string; level: number; completion: number }>;
}

export type ResourceKey = 'timber' | 'stone' | 'iron' | 'grain';
