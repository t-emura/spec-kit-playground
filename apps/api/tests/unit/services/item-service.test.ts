import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ItemService', () => {
  let ItemService: any;
  let mockItemRepo: any;
  let mockNoteRepo: any;

  beforeEach(async () => {
    const module = await import('../../../src/services/item-service.js');
    ItemService = module.ItemService;

    mockNoteRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'note-1', archived: false }),
    };

    mockItemRepo = {
      findByNoteId: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      move: vi.fn(),
    };
  });

  it('creates an item with valid content', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    const item = { id: 'item-1', noteId: 'note-1', content: 'Task', orderIndex: 0, depth: 0 };
    mockItemRepo.create.mockResolvedValue(item);
    const result = await service.createItem('note-1', { content: 'Task', orderIndex: 0, depth: 0 });
    expect(result.content).toBe('Task');
  });

  it('allows item creation with empty content', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    await expect(service.createItem('note-1', { content: '', orderIndex: 0, depth: 0 })).resolves.not.toThrow();
  });

  it('rejects item creation with depth > 10', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    await expect(service.createItem('note-1', { content: 'x', orderIndex: 0, depth: 11 })).rejects.toThrow();
  });

  it('updates item content', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    const item = { id: 'item-1', content: 'Old', noteId: 'note-1' };
    mockItemRepo.findById.mockResolvedValue(item);
    mockItemRepo.update.mockResolvedValue({ ...item, content: 'New' });
    const result = await service.updateItem('item-1', { content: 'New' });
    expect(result.content).toBe('New');
  });

  it('deletes an item and its descendants', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    mockItemRepo.findById.mockResolvedValue({ id: 'item-1' });
    mockItemRepo.delete.mockResolvedValue(undefined);
    await service.deleteItem('item-1');
    expect(mockItemRepo.delete).toHaveBeenCalledWith('item-1');
  });

  it('reorders items within the same level', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    mockItemRepo.findById.mockResolvedValue({ id: 'item-1', noteId: 'note-1' });
    mockItemRepo.move.mockResolvedValue({ id: 'item-1', orderIndex: 2 });
    const result = await service.moveItem('item-1', { targetOrderIndex: 2 });
    expect(result.orderIndex).toBe(2);
  });

  it('indents an item (re-parents to sibling above)', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    mockItemRepo.findById.mockResolvedValue({ id: 'item-2', noteId: 'note-1', orderIndex: 1, depth: 0, parentId: null });
    mockItemRepo.findByNoteId.mockResolvedValue([
      { id: 'item-1', orderIndex: 0, depth: 0, parentId: null },
      { id: 'item-2', orderIndex: 1, depth: 0, parentId: null },
    ]);
    mockItemRepo.move.mockResolvedValue({ id: 'item-2', depth: 1, parentId: 'item-1' });
    const result = await service.indentItem('item-2');
    expect(mockItemRepo.move).toHaveBeenCalled();
  });

  it('throws 404 when item not found', async () => {
    const service = new ItemService(mockItemRepo, mockNoteRepo);
    mockItemRepo.findById.mockResolvedValue(null);
    await expect(service.updateItem('non-existent', { content: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });
});
