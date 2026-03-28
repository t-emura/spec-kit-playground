import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../src/db/schema.js';
import { NoteRepository } from '../../src/repositories/note-repository.js';
import { ItemRepository } from '../../src/repositories/item-repository.js';
import { NoteService } from '../../src/services/note-service.js';
import { ItemService } from '../../src/services/item-service.js';
import { buildServer } from '../../src/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env['SQLITE_DB_PATH'] = ':memory:';
process.env['NODE_ENV'] = 'test';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return drizzle(sqlite, { schema });
}

describe('API Performance Profiles', () => {
  it('GET /v1/notes responds within 500ms', async () => {
    const server = buildServer();
    await server.ready();

    const start = Date.now();
    const response = await server.inject({ method: 'GET', url: '/v1/notes' });
    const elapsed = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(elapsed).toBeLessThan(500);

    await server.close();
  });

  it('POST /v1/notes responds within 500ms', async () => {
    const server = buildServer();
    await server.ready();

    const start = Date.now();
    const response = await server.inject({
      method: 'POST',
      url: '/v1/notes',
      payload: { title: 'Perf Test Note' },
    });
    const elapsed = Date.now() - start;

    expect(response.statusCode).toBe(201);
    expect(elapsed).toBeLessThan(500);

    await server.close();
  });

  it('GET /v1/notes/:noteId/items with 100 items responds within 500ms', async () => {
    const db = createTestDb();
    const noteRepo = new NoteRepository(db);
    const itemRepo = new ItemRepository(db);
    const noteService = new NoteService(noteRepo);
    const itemService = new ItemService(itemRepo, noteRepo);

    const note = await noteService.createNote({ title: 'Large' });
    for (let i = 0; i < 100; i++) {
      await itemService.createItem(note.id, { content: `Item ${i}`, orderIndex: i, depth: 0 });
    }

    const start = Date.now();
    const items = await itemService.getItemTree(note.id);
    const elapsed = Date.now() - start;

    expect(items).toHaveLength(100);
    expect(elapsed).toBeLessThan(500);
  });
});
