/**
 * 0005_alliances — Allianzen (GAME-MECHANICS §8): bis 100 Mitglieder, Ränge,
 * Diplomatie (allied/nap/enemy) und ein Event-Log. accounts.alliance_id existiert
 * bereits (0001); hier kommt der Rang dazu.
 */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('alliances')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('name', 'text', (c) => c.notNull().unique())
    .addColumn('tag', 'text', (c) => c.notNull().unique())
    .addColumn('leader_account', 'bigint', (c) => c.notNull().references('accounts.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.alterTable('accounts').addColumn('alliance_rank', 'text').execute();

  await db.schema
    .createTable('alliance_diplomacy')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('alliance_a', 'bigint', (c) => c.notNull().references('alliances.id').onDelete('cascade'))
    .addColumn('alliance_b', 'bigint', (c) => c.notNull().references('alliances.id').onDelete('cascade'))
    .addColumn('status', 'text', (c) => c.notNull())
    .addUniqueConstraint('diplo_pair_uniq', ['alliance_a', 'alliance_b'])
    .execute();

  await db.schema
    .createTable('alliance_events')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('alliance_id', 'bigint', (c) => c.notNull().references('alliances.id').onDelete('cascade'))
    .addColumn('text', 'text', (c) => c.notNull())
    .addColumn('at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();
  await db.schema.createIndex('alliance_events_idx').on('alliance_events').column('alliance_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('alliance_events').ifExists().execute();
  await db.schema.dropTable('alliance_diplomacy').ifExists().execute();
  await db.schema.alterTable('accounts').dropColumn('alliance_rank').execute();
  await db.schema.dropTable('alliances').ifExists().execute();
}
