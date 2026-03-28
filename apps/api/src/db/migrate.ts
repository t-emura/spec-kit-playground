import { env } from '../config/env.js';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runMigrations(dbPath?: string) {
  const targetPath = dbPath ?? env.SQLITE_DB_PATH;
  mkdirSync(dirname(targetPath), { recursive: true });
  const sqlite = new Database(targetPath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');

  const migration = readFileSync(join(__dirname, 'migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  sqlite.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
  console.log('Migrations complete');
}
