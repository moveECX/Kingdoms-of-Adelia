/**
 * 0003_pvp — Belagerungsfortschritt pro Stadt (GAME-MECHANICS §5).
 * 0–100; ein Marshal beansprucht pro Welle 10 % (6 % nachts), 100 % = Eroberung.
 */
import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('cities')
    .addColumn('siege_progress', 'integer', (c) => c.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('cities').dropColumn('siege_progress').execute();
}
