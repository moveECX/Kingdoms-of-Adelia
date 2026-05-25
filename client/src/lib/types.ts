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

export interface MapCity {
  id: number;
  name: string;
  x: number;
  y: number;
  account_id: number;
  username: string;
}

export interface MapData {
  cities: MapCity[];
  dungeons: Array<{ id: number; x: number; y: number; dungeon_type: string; level: number; completion: number }>;
}

export interface Account {
  id: number;
  username: string;
  title: string;
  gold: number;
}

export interface Me {
  account: Account | null;
  cities: Array<{ id: number; name: string; x: number; y: number }>;
}

export interface ChatMessage {
  channel: 'global' | 'city' | 'alliance';
  cityId?: number;
  username: string;
  text: string;
  at: string;
}

export interface CombatReport {
  id: number;
  attacker_id: number | null;
  defender_id: number | null;
  target_x: number;
  target_y: number;
  occurred_at: string;
  detail: Record<string, unknown>;
}

export interface MarketListing {
  id: number;
  give_resource: string;
  give_qty: number;
  want_gold: number;
  seller_account: number;
  username: string;
  created_at: string;
}

export interface AllianceSummary {
  id: number;
  name: string;
  tag: string;
  leader_account: number;
  members: number;
}

export interface MyAlliance {
  alliance: { id: number; name: string; tag: string; leader_account: number } | null;
  myRank?: string | null;
  members?: Array<{ id: number; username: string; alliance_rank: string | null }>;
  events?: Array<{ id: number; text: string; at: string }>;
  diplomacy?: Array<{ id: number; alliance_a: number; alliance_b: number; status: string }>;
}

export interface EndgameData {
  world: { id: number; ended: boolean; champion_alliance: number | null; ended_at: string | null } | null;
  shrines: Array<{ id: number; x: number; y: number; virtue: string; active: boolean }>;
  faith: Record<string, number> | null;
}

export interface Leaderboard {
  players: Array<{ id: number; username: string; title: string; rank_points: number }>;
  alliances: Array<{ id: number; name: string; tag: string; faith: number }>;
}

export type ResourceKey = 'timber' | 'stone' | 'iron' | 'grain';
