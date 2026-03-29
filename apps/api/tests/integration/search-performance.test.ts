import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../src/db/schema.js';
import { NoteRepository } from '../../src/repositories/note-repository.js';
import { ItemRepository } from '../../src/repositories/item-repository.js';
import { ItemVisualStateRepository } from '../../src/repositories/item-visual-state-repository.js';
import { NoteService } from '../../src/services/note-service.js';
import { ItemService } from '../../src/services/item-service.js';
import { SearchService } from '../../src/services/search-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return drizzle(sqlite, { schema });
}

describe('Search Performance with 100+ items', () => {
  let db: ReturnType<typeof createTestDb>;
  let noteService: NoteService;
  let itemService: ItemService;
  let searchService: SearchService;
  let noteId: string;

  beforeEach(async () => {
    db = createTestDb();
    const noteRepo = new NoteRepository(db);
    const itemRepo = new ItemRepository(db);
    const _visualStateRepo = new ItemVisualStateRepository(db);
    noteService = new NoteService(noteRepo);
    itemService = new ItemService(itemRepo, noteRepo);
    searchService = new SearchService(itemRepo);

    const note = await noteService.createNote({ title: 'Large Outline' });
    noteId = note.id;

    // Create 110 items
    for (let i = 0; i < 110; i++) {
      await itemService.createItem(noteId, {
        content: `Item ${i}: ${i % 10 === 0 ? 'special-target' : 'regular content'}`,
        orderIndex: i,
        depth: 0,
      });
    }
  });

  it('finds items matching search term in 100+ item outline', async () => {
    const result = await searchService.search(noteId, 'special-target');
    expect(result.items.length).toBe(11); // items 0,10,20,...,100
    expect(result.total).toBe(11);
  });

  it('returns all items when search is broad', async () => {
    const result = await searchService.search(noteId, 'item');
    expect(result.items.length).toBeGreaterThan(100);
  });

  it('completes search in reasonable time', async () => {
    const start = Date.now();
    await searchService.search(noteId, 'regular');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500); // should be well under 500ms
  });

  it('search is case-insensitive', async () => {
    const result = await searchService.search(noteId, 'SPECIAL-TARGET');
    expect(result.items.length).toBeGreaterThan(0);
  });
});
