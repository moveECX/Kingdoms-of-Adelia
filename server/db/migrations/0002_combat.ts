/**
 * 0002_combat — Phase-2-Tabellen (GAME-DATA-SCHEMA.md §2):
 * garrison, training_queue, military_actions, combat_reports, dungeons.
 */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('garrison')
    .addColumn('city_id', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('unit_key', 'text', (c) => c.notNull())
    .addColumn('qty', 'bigint', (c) => c.notNull().defaultTo(0))
    .addPrimaryKeyConstraint('garrison_pk', ['city_id', 'unit_key'])
    .execute();

  await db.schema
    .createTable('training_queue')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('city_id', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('unit_key', 'text', (c) => c.notNull())
    .addColumn('qty_total', 'integer', (c) => c.notNull())
    .addColumn('qty_done', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('resolve_at', 'timestamptz', (c) => c.notNull())
    .execute();
  await db.schema.createIndex('training_due_idx').on('training_queue').column('resolve_at').execute();

  await db.schema
    .createTable('military_actions')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('kind', 'text', (c) => c.notNull())
    .addColumn('origin_city', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('target_x', 'integer', (c) => c.notNull())
    .addColumn('target_y', 'integer', (c) => c.notNull())
    .addColumn('troops', 'jsonb', (c) => c.notNull())
    .addColumn('cargo', 'jsonb')
    .addColumn('depart_at', 'timestamptz', (c) => c.notNull())
    .addColumn('resolve_at', 'timestamptz', (c) => c.notNull())
    .addColumn('phase', 'text', (c) => c.notNull().defaultTo('outbound'))
    .execute();
  await db.schema.createIndex('mil_due_idx').on('military_actions').column('resolve_at').execute();

  await db.schema
    .createTable('combat_reports')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('attacker_id', 'bigint', (c) => c.references('accounts.id').onDelete('set null'))
    .addColumn('defender_id', 'bigint', (c) => c.references('accounts.id').onDelete('set null'))
    .addColumn('target_x', 'integer', (c) => c.notNull())
    .addColumn('target_y', 'integer', (c) => c.notNull())
    .addColumn('occurred_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('detail', 'jsonb', (c) => c.notNull())
    .execute();

  await db.schema
    .createTable('dungeons')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('x', 'integer', (c) => c.notNull())
    .addColumn('y', 'integer', (c) => c.notNull())
    .addColumn('dungeon_type', 'text', (c) => c.notNull())
    .addColumn('level', 'smallint', (c) => c.notNull())
    .addColumn('completion', 'smallint', (c) => c.notNull().defaultTo(0))
    .addUniqueConstraint('dungeons_xy_uniq', ['x', 'y'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('dungeons').ifExists().execute();
  await db.schema.dropTable('combat_reports').ifExists().execute();
  await db.schema.dropTable('military_actions').ifExists().execute();
  await db.schema.dropTable('training_queue').ifExists().execute();
  await db.schema.dropTable('garrison').ifExists().execute();
}
