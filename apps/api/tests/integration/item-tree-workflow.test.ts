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

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return drizzle(sqlite, { schema });
}

describe('Item Tree Move and Collapse State Persistence', () => {
  let db: ReturnType<typeof createTestDb>;
  let noteService: NoteService;
  let itemService: ItemService;
  let noteId: string;

  beforeEach(async () => {
    db = createTestDb();
    const noteRepo = new NoteRepository(db);
    const itemRepo = new ItemRepository(db);
    noteService = new NoteService(noteRepo);
    itemService = new ItemService(itemRepo, noteRepo);
    const note = await noteService.createNote({ title: 'Tree Test Note' });
    noteId = note.id;
  });

  it('creates 10 items and persists them', async () => {
    for (let i = 0; i < 10; i++) {
      await itemService.createItem(noteId, { content: `Item ${i}`, orderIndex: i, depth: 0 });
    }
    const items = await itemService.getItemTree(noteId);
    expect(items).toHaveLength(10);
  });

  it('moves an item within the tree', async () => {
    const a = await itemService.createItem(noteId, { content: 'A', orderIndex: 0, depth: 0 });
    const b = await itemService.createItem(noteId, { content: 'B', orderIndex: 1, depth: 0 });
    const c = await itemService.createItem(noteId, { content: 'C', orderIndex: 2, depth: 0 });

    // Move A to position 2 (after B and C)
    await itemService.moveItem(a.id, { targetOrderIndex: 2 });
    const items = await itemService.getItemTree(noteId);
    const sorted = items.sort((x, y) => x.orderIndex - y.orderIndex);
    expect(sorted[0]!.content).not.toBe('A');
  });

  it('persists collapse state', async () => {
    const item = await itemService.createItem(noteId, { content: 'Collapsible', orderIndex: 0, depth: 0 });
    await itemService.updateItem(item.id, { isCollapsed: true });
    const tree = await itemService.getItemTree(noteId);
    const found = tree.find((i) => i.id === item.id);
    expect(found!.isCollapsed).toBe(true);
  });

  it('cascades delete of parent to remove children', async () => {
    const parent = await itemService.createItem(noteId, { content: 'Parent', orderIndex: 0, depth: 0 });
    await itemService.createItem(noteId, { content: 'Child', orderIndex: 0, depth: 1, parentId: parent.id });
    await itemService.deleteItem(parent.id);
    const items = await itemService.getItemTree(noteId);
    expect(items).toHaveLength(0);
  });

  it('allows re-parenting an item to a different parent', async () => {
    const p1 = await itemService.createItem(noteId, { content: 'Parent 1', orderIndex: 0, depth: 0 });
    const p2 = await itemService.createItem(noteId, { content: 'Parent 2', orderIndex: 1, depth: 0 });
    const child = await itemService.createItem(noteId, { content: 'Child', orderIndex: 0, depth: 1, parentId: p1.id });

    await itemService.moveItem(child.id, { targetParentId: p2.id, targetOrderIndex: 0 });
    const tree = await itemService.getItemTree(noteId);
    const movedChild = tree.find((i) => i.id === child.id);
    expect(movedChild!.parentId).toBe(p2.id);
  });
});
