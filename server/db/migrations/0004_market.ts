/**
 * 0004_market — Spieler-Marktplatz (GAME-MECHANICS §8): Inserate bieten eine
 * Ressourcenmenge gegen Gold. Die angebotene Menge wird beim Erstellen aus der
 * Verkäuferstadt einbehalten (Escrow) und bei Annahme per Transfer geliefert.
 */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('market_listings')
    .addColumn('id', 'bigint', (c) => c.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('seller_city', 'bigint', (c) => c.notNull().references('cities.id').onDelete('cascade'))
    .addColumn('seller_account', 'bigint', (c) => c.notNull().references('accounts.id').onDelete('cascade'))
    .addColumn('give_resource', 'text', (c) => c.notNull())
    .addColumn('give_qty', 'bigint', (c) => c.notNull())
    .addColumn('want_gold', 'bigint', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();
  await db.schema.createIndex('market_res_idx').on('market_listings').column('give_resource').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('market_listings').ifExists().execute();
}
