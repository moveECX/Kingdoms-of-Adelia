import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
import type { Database } from './types';

// pg liefert bigint (int8, OID 20) per Default als string, um Präzision zu wahren.
// Unsere Werte bleiben < 2^53, daher lesen wir sie als number — vereinfacht die Spiel-Mathematik.
types.setTypeParser(20, (value: string) => Number(value));

/** Erzeugt eine Kysely-Instanz aus DATABASE_URL (oder einem expliziten String). */
export function createDb(connectionString = process.env.DATABASE_URL): Kysely<Database> {
  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL ist nicht gesetzt (siehe .env.example).');
  }
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new Pool({ connectionString }) }),
  });
}
