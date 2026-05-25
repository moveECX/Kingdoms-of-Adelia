/**
 * 0006_endgame — Endgame (GAME-MECHANICS §9): Schreine (8 Tugenden) erleuchten
 * nahe Allianzstädte; diese bauen Paläste (1/Stadt, max L10, einer Tugend). Eine
 * Allianz mit L10-Palast aller acht Tugenden gewinnt. world_state ist Singleton (id=1).
 */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('shrines')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('x', 'integer', (c) => c.notNull())
    .addColumn('y', 'integer', (c) => c.notNull())
    .addColumn('virtue', 'text', (c) => c.notNull())
    .addColumn('active', 'boolean', (c) => c.notNull().defaultTo(false))
    .addUniqueConstraint('shrines_xy_uniq', ['x', 'y'])
    .execute();

  await db.schema
    .createTable('palaces')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('city_id', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade').unique())
    .addColumn('virtue', 'text', (c) => c.notNull())
    .addColumn('level', 'integer', (c) => c.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createTable('world_state')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('ended', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('champion_alliance', 'bigint', (c) => c.references('alliances.id').onDelete('set null'))
    .addColumn('ended_at', 'timestamptz')
    .execute();
  await sql`INSERT INTO world_state (id, ended) VALUES (1, false)`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('world_state').ifExists().execute();
  await db.schema.dropTable('palaces').ifExists().execute();
  await db.schema.dropTable('shrines').ifExists().execute();
}
