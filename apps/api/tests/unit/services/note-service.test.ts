import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NoteService', () => {
  let NoteService: any;
  let mockRepo: any;

  beforeEach(async () => {
    const module = await import('../../../src/services/note-service.js');
    NoteService = module.NoteService;

    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('lists notes from repository', async () => {
    const service = new NoteService(mockRepo);
    const notes = [{ id: '1', title: 'A', version: 1 }];
    mockRepo.findAll.mockResolvedValue(notes);
    const result = await service.listNotes();
    expect(result).toEqual(notes);
    expect(mockRepo.findAll).toHaveBeenCalledOnce();
  });

  it('creates a note with validated title', async () => {
    const service = new NoteService(mockRepo);
    const created = { id: 'uuid', title: 'My Note', version: 1 };
    mockRepo.create.mockResolvedValue(created);
    const result = await service.createNote({ title: 'My Note' });
    expect(result.title).toBe('My Note');
  });

  it('throws validation error for empty title', async () => {
    const service = new NoteService(mockRepo);
    await expect(service.createNote({ title: '' })).rejects.toThrow();
  });

  it('throws validation error for too-long title', async () => {
    const service = new NoteService(mockRepo);
    await expect(service.createNote({ title: 'a'.repeat(121) })).rejects.toThrow();
  });

  it('updates a note with optimistic locking', async () => {
    const service = new NoteService(mockRepo);
    const existing = { id: '1', title: 'Old', version: 1 };
    const updated = { ...existing, title: 'New', version: 2 };
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);
    const result = await service.updateNote('1', { title: 'New', version: 1 });
    expect(result.title).toBe('New');
  });

  it('throws 409 when version conflicts on update', async () => {
    const service = new NoteService(mockRepo);
    const existing = { id: '1', title: 'Old', version: 3 };
    mockRepo.findById.mockResolvedValue(existing);
    // simulate conflict
    const err = Object.assign(new Error('Version conflict'), { statusCode: 409 });
    mockRepo.update.mockRejectedValue(err);
    await expect(service.updateNote('1', { title: 'New', version: 1 })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('throws 404 when note not found', async () => {
    const service = new NoteService(mockRepo);
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getNoteById('non-existent')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects updates on archived notes', async () => {
    const service = new NoteService(mockRepo);
    mockRepo.findById.mockResolvedValue({ id: '1', archived: true, version: 1 });
    await expect(service.updateNote('1', { title: 'x', version: 1 })).rejects.toThrow();
  });
});
