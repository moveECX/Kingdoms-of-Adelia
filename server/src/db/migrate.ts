/**
 * Migrations-Runner (CLI): `npm run migrate`.
 * Nutzt einen statischen Provider statt FileMigrationProvider — dessen
 * dynamischer import() von Backslash-Pfaden scheitert unter Windows
 * (ERR_UNSUPPORTED_ESM_URL_SCHEME). Neue Migrationen hier importieren
 * und in die Map eintragen.
 * Setzt eine laufende Postgres-Instanz voraus (`docker compose up -d db`).
 */
import { Migrator } from 'kysely';
import type { Migration, MigrationProvider } from 'kysely';
import { createDb } from './connection';
import * as m0001Core from '../../db/migrations/0001_core';
import * as m0002Combat from '../../db/migrations/0002_combat';
import * as m0003Pvp from '../../db/migrations/0003_pvp';
import * as m0004Market from '../../db/migrations/0004_market';
import * as m0005Alliances from '../../db/migrations/0005_alliances';
import * as m0006Endgame from '../../db/migrations/0006_endgame';

const migrations: Record<string, Migration> = {
  '0001_core': m0001Core,
  '0002_combat': m0002Combat,
  '0003_pvp': m0003Pvp,
  '0004_market': m0004Market,
  '0005_alliances': m0005Alliances,
  '0006_endgame': m0006Endgame,
};

const provider: MigrationProvider = {
  getMigrations() {
    return Promise.resolve(migrations);
  },
};

const db = createDb();
const migrator = new Migrator({ db, provider });

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
