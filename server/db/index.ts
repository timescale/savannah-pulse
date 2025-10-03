import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from 'kysely';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolConfig } from 'pg';

import type { Database } from './types';

export * from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const poolConfig: PoolConfig = {
  database: process.env['PGDATABASE'],
  host: process.env['PGHOST'],
  user: process.env['PGUSER'],
  password: process.env['PGPASSWORD'],
  max: 10,
};

if (process.env['PGPORT']) {
  poolConfig.port = parseInt(process.env['PGPORT'], 10);
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool(poolConfig),
  }),
  log: process.env['DEBUG'] ? ['error', 'query'] : ['error'],
});

async function migrateToLatest() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool(poolConfig),
    }),
    log: process.env['DEBUG'] ? ['error', 'query'] : ['error'],
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();
