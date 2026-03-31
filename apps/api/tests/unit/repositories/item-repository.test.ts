import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NoteRepository } from '../../../src/repositories/note-repository.js';
import { ItemRepository } from '../../../src/repositories/item-repository.js';

let tmpDir: string;
let noteRepo: NoteRepository;
let itemRepo: ItemRepository;
let noteId: string;

beforeEach(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'item-repo-test-'));
  noteRepo = new NoteRepository(tmpDir);
  itemRepo = new ItemRepository(tmpDir, noteRepo);
  const note = await noteRepo.create({ title: 'Test Note' });
  noteId = note.id;
});
afterEach(() => rmSync(tmpDir, { recursive: true }));

describe('ItemRepository', () => {
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

  it('finds an item by id', async () => {
    const created = await itemRepo.create(noteId, { content: 'Find Me', orderIndex: 0, depth: 0 });
    const found = await itemRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found!.content).toBe('Find Me');
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
    await itemRepo.create(noteId, { content: 'B', orderIndex: 1, depth: 0 });
    await itemRepo.create(noteId, { content: 'C', orderIndex: 2, depth: 0 });

    // Move A from position 0 to position 2
    await itemRepo.move(item1.id, { targetParentId: null, targetOrderIndex: 2 });

    const items = await itemRepo.findByNoteId(noteId);
    items.sort((a, b) => a.orderIndex - b.orderIndex);
    // After move: B should be first, A should be at position 2
    expect(items[0]!.content).toBe('B');
    expect(items.find(i => i.content === 'A')!.orderIndex).toBe(2);
  });

  it('updates collapse state of an item', async () => {
    const item = await itemRepo.create(noteId, { content: 'Collapsible', orderIndex: 0, depth: 0 });
    const updated = await itemRepo.update(item.id, { isCollapsed: true });
    expect(updated!.isCollapsed).toBe(true);
  });

  it('reorders siblings when inserting between items', async () => {
    await itemRepo.create(noteId, { content: 'A', orderIndex: 0, depth: 0 });
    await itemRepo.create(noteId, { content: 'B', orderIndex: 1, depth: 0 });
    await itemRepo.create(noteId, { content: 'X', orderIndex: 1, depth: 0 });

    const items = await itemRepo.findByNoteId(noteId);
    const sorted = items.sort((a, b) => a.orderIndex - b.orderIndex);
    expect(sorted.find((i) => i.content === 'X')!.orderIndex).toBeLessThan(
      sorted.find((i) => i.content === 'B')!.orderIndex,
    );
  });

  it('searchItems returns matching items', async () => {
    await itemRepo.create(noteId, { content: 'Hello world', orderIndex: 0, depth: 0 });
    await itemRepo.create(noteId, { content: 'Goodbye', orderIndex: 1, depth: 0 });
    const results = await itemRepo.searchItems(noteId, 'hello');
    expect(results).toHaveLength(1);
    expect(results[0]!.content).toBe('Hello world');
  });
});
