import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { env } from '../config/env.js';
import { runMigrations } from './migrate.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  runMigrations();
  const sqlite = new Database(env.SQLITE_DB_PATH);
  const db = drizzle(sqlite, { schema });

  const now = new Date().toISOString();
  const noteId = uuidv4();

  await db.insert(schema.notes).values({
    id: noteId,
    title: 'My First Outline',
    description: 'A sample note to get started',
    viewMode: 'tree',
    version: 1,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });

  const items = [
    'Project goals',
    'Research tasks',
    'Key decisions',
  ];

  for (let i = 0; i < items.length; i++) {
    await db.insert(schema.items).values({
      id: uuidv4(),
      noteId,
      parentId: null,
      orderIndex: i,
      depth: 0,
      content: items[i]!,
      isCollapsed: false,
      highlightLevel: 'none',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`Seeded note: ${noteId}`);
  sqlite.close();
}

seed().catch(console.error);
