/**
 * Migrations-Runner (CLI): `npm run migrate` → `tsx src/db/migrate.ts`.
 * Wendet alle ausstehenden Migrationen aus server/db/migrations an.
 * Setzt eine laufende Postgres-Instanz voraus (`docker compose up -d db`).
 */
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMigrationProvider, Migrator } from 'kysely';
import { createDb } from './connection';

const migrationFolder = join(dirname(fileURLToPath(import.meta.url)), '../../db/migrations');

const db = createDb();
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({ fs, path: { join }, migrationFolder }),
});

const { error, results } = await migrator.migrateToLatest();

for (const result of results ?? []) {
  const mark = result.status === 'Success' ? '✓' : result.status === 'Error' ? '✗' : '·';
  console.log(`${mark} ${result.migrationName} (${result.direction})`);
}

await db.destroy();

if (error) {
  console.error('Migration fehlgeschlagen:', error);
  process.exit(1);
}
console.log('Migrationen aktuell.');
