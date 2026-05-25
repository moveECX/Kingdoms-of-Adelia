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
  now: string;
}

export type ResourceKey = 'timber' | 'stone' | 'iron' | 'grain';
