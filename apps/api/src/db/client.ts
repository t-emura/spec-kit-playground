import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { env } from '../config/env.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function createDbClient() {
  const dbPath = env.SQLITE_DB_PATH;
  mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export const db = createDbClient();
export type DB = typeof db;
