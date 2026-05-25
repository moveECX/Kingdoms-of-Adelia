/**
 * Kysely-Datenbanktypen (Phase-1-Kern). Siehe GAME-DATA-SCHEMA.md §2.
 * `bigint`-Spalten werden als `number` gelesen (pg-Parser in connection.ts);
 * unsere Werte bleiben sicher < 2^53.
 */
import type { ColumnType, Generated } from 'kysely';

/** timestamptz: gelesen als Date; beim Insert optional (DB-Default möglich). */
type Timestamptz = ColumnType<Date, Date | string | undefined, Date | string>;
type NullableTimestamptz = ColumnType<
  Date | null,
  Date | string | null | undefined,
  Date | string | null
>;
/** Spalte mit DB-Default → beim Insert optional. */
type WithDefault<T> = ColumnType<T, T | undefined, T>;

export interface AccountsTable {
  id: Generated<number>;
  username: string;
  email: string;
  password_hash: string;
  title: WithDefault<string>;
  gold: WithDefault<number>;
  mana: WithDefault<number>;
  rank_points: WithDefault<number>;
  alliance_id: number | null; // FK auf alliances folgt in Phase 4
  created_at: Timestamptz;
  last_seen_at: NullableTimestamptz;
}

export interface CitiesTable {
  id: Generated<number>;
  account_id: number;
  name: WithDefault<string>;
  x: number;
  y: number;
  timber: WithDefault<number>;
  timber_rate_h: WithDefault<number>;
  stone: WithDefault<number>;
  stone_rate_h: WithDefault<number>;
  iron: WithDefault<number>;
  iron_rate_h: WithDefault<number>;
  grain: WithDefault<number>;
  grain_rate_h: WithDefault<number>;
  cap_timber: WithDefault<number>;
  cap_stone: WithDefault<number>;
  cap_iron: WithDefault<number>;
  cap_grain: WithDefault<number>;
  resources_as_of: Timestamptz;
  construction_pct: WithDefault<number>;
  layout_dirty: WithDefault<boolean>;
  protected_until: NullableTimestamptz;
  created_at: Timestamptz;
}

export interface CityTilesTable {
  city_id: number;
  slot_x: number;
  slot_y: number;
  node_type: string; // 'wood'|'stone'|'iron'|'grain'|'lake'|'empty'
}

export interface CityBuildingsTable {
  id: Generated<number>;
  city_id: number;
  slot_x: number;
  slot_y: number;
  building_key: string;
  level: WithDefault<number>;
  adjacency_pct: WithDefault<number>;
  production_h: WithDefault<number>;
}

export interface BuildQueueTable {
  id: Generated<number>;
  city_id: number;
  slot_x: number;
  slot_y: number;
  building_key: string;
  to_level: number;
  started_at: Timestamptz;
  resolve_at: ColumnType<Date, Date | string, Date | string>;
  ordinal: number;
}

export interface GarrisonTable {
  city_id: number;
  unit_key: string;
  qty: WithDefault<number>;
}

export interface TrainingQueueTable {
  id: Generated<number>;
  city_id: number;
  unit_key: string;
  qty_total: number;
  qty_done: WithDefault<number>;
  resolve_at: ColumnType<Date, Date | string, Date | string>;
}

export interface MilitaryActionsTable {
  id: Generated<number>;
  kind: string;
  origin_city: number;
  target_x: number;
  target_y: number;
  troops: ColumnType<Record<string, number>, string, string>;
  cargo: ColumnType<Record<string, number> | null, string | null, string | null>;
  depart_at: ColumnType<Date, Date | string, Date | string>;
  resolve_at: ColumnType<Date, Date | string, Date | string>;
  phase: WithDefault<string>;
}

export interface CombatReportsTable {
  id: Generated<number>;
  attacker_id: number | null;
  defender_id: number | null;
  target_x: number;
  target_y: number;
  occurred_at: Timestamptz;
  detail: ColumnType<unknown, string, string>;
}

export interface DungeonsTable {
  id: Generated<number>;
  x: number;
  y: number;
  dungeon_type: string;
  level: number;
  completion: WithDefault<number>;
}

export interface Database {
  accounts: AccountsTable;
  cities: CitiesTable;
  city_tiles: CityTilesTable;
  city_buildings: CityBuildingsTable;
  build_queue: BuildQueueTable;
  garrison: GarrisonTable;
  training_queue: TrainingQueueTable;
  military_actions: MilitaryActionsTable;
  combat_reports: CombatReportsTable;
  dungeons: DungeonsTable;
}
