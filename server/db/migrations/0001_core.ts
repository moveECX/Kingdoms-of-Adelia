/**
 * 0001_core — Phase-1-Kernschema (GAME-DATA-SCHEMA.md §2):
 * accounts, cities, city_tiles, city_buildings, build_queue.
 * (FK accounts.alliance_id → alliances folgt in Phase 4.)
 */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS citext`.execute(db);

  await db.schema
    .createTable('accounts')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('username', 'varchar(24)', (c) => c.notNull().unique())
    .addColumn('email', sql`citext`, (c) => c.notNull().unique())
    .addColumn('password_hash', 'text', (c) => c.notNull())
    .addColumn('title', 'text', (c) => c.notNull().defaultTo('sir'))
    .addColumn('gold', 'bigint', (c) => c.notNull().defaultTo(0))
    .addColumn('mana', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('rank_points', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('alliance_id', 'bigint')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('last_seen_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('cities')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('account_id', 'bigint', (c) =>
      c.notNull().references('accounts.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(24)', (c) => c.notNull().defaultTo('New City'))
    .addColumn('x', 'integer', (c) => c.notNull())
    .addColumn('y', 'integer', (c) => c.notNull())
    .addColumn('timber', 'bigint', (c) => c.notNull().defaultTo(0))
    .addColumn('timber_rate_h', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('stone', 'bigint', (c) => c.notNull().defaultTo(0))
    .addColumn('stone_rate_h', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('iron', 'bigint', (c) => c.notNull().defaultTo(0))
    .addColumn('iron_rate_h', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('grain', 'bigint', (c) => c.notNull().defaultTo(0))
    .addColumn('grain_rate_h', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('cap_timber', 'bigint', (c) => c.notNull().defaultTo(5000))
    .addColumn('cap_stone', 'bigint', (c) => c.notNull().defaultTo(5000))
    .addColumn('cap_iron', 'bigint', (c) => c.notNull().defaultTo(5000))
    .addColumn('cap_grain', 'bigint', (c) => c.notNull().defaultTo(5000))
    .addColumn('resources_as_of', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('construction_pct', 'integer', (c) => c.notNull().defaultTo(100))
    .addColumn('layout_dirty', 'boolean', (c) => c.notNull().defaultTo(true))
    .addColumn('protected_until', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('cities_xy_uniq', ['x', 'y'])
    .execute();
  await db.schema.createIndex('cities_account_idx').on('cities').column('account_id').execute();

  await db.schema
    .createTable('city_tiles')
    .addColumn('city_id', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('slot_x', 'smallint', (c) => c.notNull())
    .addColumn('slot_y', 'smallint', (c) => c.notNull())
    .addColumn('node_type', 'text', (c) => c.notNull())
    .addPrimaryKeyConstraint('city_tiles_pk', ['city_id', 'slot_x', 'slot_y'])
    .execute();

  await db.schema
    .createTable('city_buildings')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('city_id', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('slot_x', 'smallint', (c) => c.notNull())
    .addColumn('slot_y', 'smallint', (c) => c.notNull())
    .addColumn('building_key', 'text', (c) => c.notNull())
    .addColumn('level', 'smallint', (c) => c.notNull().defaultTo(1))
    .addColumn('adjacency_pct', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('production_h', 'integer', (c) => c.notNull().defaultTo(0))
    .addUniqueConstraint('city_buildings_slot_uniq', ['city_id', 'slot_x', 'slot_y'])
    .execute();
  await db.schema
    .createIndex('city_buildings_city_idx')
    .on('city_buildings')
    .column('city_id')
    .execute();

  await db.schema
    .createTable('build_queue')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('city_id', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('slot_x', 'smallint', (c) => c.notNull())
    .addColumn('slot_y', 'smallint', (c) => c.notNull())
    .addColumn('building_key', 'text', (c) => c.notNull())
    .addColumn('to_level', 'smallint', (c) => c.notNull())
    .addColumn('started_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('resolve_at', 'timestamptz', (c) => c.notNull())
    .addColumn('ordinal', 'smallint', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('build_queue_due_idx')
    .on('build_queue')
    .column('resolve_at')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('build_queue').ifExists().execute();
  await db.schema.dropTable('city_buildings').ifExists().execute();
  await db.schema.dropTable('city_tiles').ifExists().execute();
  await db.schema.dropTable('cities').ifExists().execute();
  await db.schema.dropTable('accounts').ifExists().execute();
}
