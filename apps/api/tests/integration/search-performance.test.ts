import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NoteRepository } from '../../src/repositories/note-repository.js';
import { ItemRepository } from '../../src/repositories/item-repository.js';
import { NoteService } from '../../src/services/note-service.js';
import { ItemService } from '../../src/services/item-service.js';
import { SearchService } from '../../src/services/search-service.js';

let tmpDir: string;
let noteService: NoteService;
let itemService: ItemService;
let searchService: SearchService;
let noteId: string;

describe('Search Performance with 100+ items', () => {
  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'search-perf-'));
    const noteRepo = new NoteRepository(tmpDir);
    const itemRepo = new ItemRepository(tmpDir, noteRepo);
    noteService = new NoteService(noteRepo);
    itemService = new ItemService(itemRepo, noteRepo);
    searchService = new SearchService(itemRepo);

    const note = await noteService.createNote({ title: 'Large Outline' });
    noteId = note.id;

    for (let i = 0; i < 110; i++) {
      await itemService.createItem(noteId, {
        content: `Item ${i}: ${i % 10 === 0 ? 'special-target' : 'regular content'}`,
        orderIndex: i,
        depth: 0,
      });
    }
  });

  afterEach(() => rmSync(tmpDir, { recursive: true }));

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
    expect(elapsed).toBeLessThan(500);
  });

  it('search is case-insensitive', async () => {
    const result = await searchService.search(noteId, 'SPECIAL-TARGET');
    expect(result.items.length).toBeGreaterThan(0);
  });
});
