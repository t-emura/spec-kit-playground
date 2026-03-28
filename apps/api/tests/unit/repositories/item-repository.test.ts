import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../../src/db/schema.js';
import { NoteRepository } from '../../../src/repositories/note-repository.js';
import { ItemRepository } from '../../../src/repositories/item-repository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return drizzle(sqlite, { schema });
}

describe('ItemRepository', () => {
  let db: ReturnType<typeof createTestDb>;
  let noteRepo: NoteRepository;
  let itemRepo: ItemRepository;
  let noteId: string;

  beforeEach(async () => {
    db = createTestDb();
    noteRepo = new NoteRepository(db);
    itemRepo = new ItemRepository(db);
    const note = await noteRepo.create({ title: 'Test Note' });
    noteId = note.id;
  });

  it('creates an item', async () => {
    const item = await itemRepo.create(noteId, {
      content: 'First item',
      orderIndex: 0,
      depth: 0,
      parentId: null,
    });
    expect(item.id).toBeDefined();
    expect(item.content).toBe('First item');
    expect(item.depth).toBe(0);
  });

  it('finds all items for a note', async () => {
    await itemRepo.create(noteId, { content: 'Item 1', orderIndex: 0, depth: 0 });
    await itemRepo.create(noteId, { content: 'Item 2', orderIndex: 1, depth: 0 });
    const items = await itemRepo.findByNoteId(noteId);
    expect(items).toHaveLength(2);
  });

  it('updates an item content', async () => {
    const item = await itemRepo.create(noteId, { content: 'Original', orderIndex: 0, depth: 0 });
    const updated = await itemRepo.update(item.id, { content: 'Updated' });
    expect(updated!.content).toBe('Updated');
  });

  it('deletes an item and its descendants', async () => {
    const parent = await itemRepo.create(noteId, { content: 'Parent', orderIndex: 0, depth: 0 });
    await itemRepo.create(noteId, { content: 'Child', orderIndex: 0, depth: 1, parentId: parent.id });
    await itemRepo.delete(parent.id);
    const items = await itemRepo.findByNoteId(noteId);
    expect(items).toHaveLength(0);
  });

  it('moves an item to a new position in the same level', async () => {
    const item1 = await itemRepo.create(noteId, { content: 'A', orderIndex: 0, depth: 0 });
    const item2 = await itemRepo.create(noteId, { content: 'B', orderIndex: 1, depth: 0 });
    const item3 = await itemRepo.create(noteId, { content: 'C', orderIndex: 2, depth: 0 });

    // Move item1 to end
    await itemRepo.move(item1.id, { targetParentId: null, targetOrderIndex: 2 });

    const items = await itemRepo.findByNoteId(noteId);
    items.sort((a, b) => a.orderIndex - b.orderIndex);
    expect(items[0]!.content).toBe('B');
    expect(items[items.length - 1]!.content).toBe('A');
  });

  it('updates collapse state of an item', async () => {
    const item = await itemRepo.create(noteId, { content: 'Collapsible', orderIndex: 0, depth: 0 });
    const updated = await itemRepo.update(item.id, { isCollapsed: true });
    expect(updated!.isCollapsed).toBe(true);
  });

  it('reorders siblings when inserting between items', async () => {
    await itemRepo.create(noteId, { content: 'A', orderIndex: 0, depth: 0 });
    await itemRepo.create(noteId, { content: 'B', orderIndex: 1, depth: 0 });
    const newItem = await itemRepo.create(noteId, { content: 'X', orderIndex: 1, depth: 0 });

    const items = await itemRepo.findByNoteId(noteId);
    const sorted = items.sort((a, b) => a.orderIndex - b.orderIndex);
    expect(sorted.find(i => i.content === 'X')!.orderIndex).toBeLessThan(
      sorted.find(i => i.content === 'B')!.orderIndex
    );
  });
});
