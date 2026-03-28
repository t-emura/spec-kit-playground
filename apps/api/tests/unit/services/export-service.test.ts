import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

describe('ExportService', () => {
  let ExportService: any;
  let mockNoteRepo: any;
  let mockItemRepo: any;
  let mockMetaRepo: any;
  let mockSnapshotRepo: any;

  beforeEach(async () => {
    const module = await import('../../../src/services/export-service.js');
    ExportService = module.ExportService;

    const note = {
      id: 'note-1', title: 'My Note', description: 'desc', version: 1,
      viewMode: 'tree', archived: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const items = [
      { id: 'i1', noteId: 'note-1', parentId: null, orderIndex: 0, depth: 0, content: 'Item one', isCollapsed: false, highlightLevel: 'none', status: 'active', createdAt: '', updatedAt: '' },
    ];

    mockNoteRepo = { findById: vi.fn().mockResolvedValue(note) };
    mockItemRepo = { findByNoteId: vi.fn().mockResolvedValue(items) };
    mockMetaRepo = { findByItemId: vi.fn().mockResolvedValue(null) };
    mockSnapshotRepo = { create: vi.fn().mockImplementation(async (data: any) => ({ ...data, id: 'snap-1', createdAt: new Date().toISOString() })) };
  });

  it('exports note as json with structure', async () => {
    const service = new ExportService(mockNoteRepo, mockItemRepo, mockMetaRepo, mockSnapshotRepo);
    const result = await service.export('note-1', { format: 'json', includeMetadata: false });
    const payload = JSON.parse(result.payload);
    expect(payload).toHaveProperty('note');
    expect(payload).toHaveProperty('items');
    expect(payload.note.title).toBe('My Note');
  });

  it('includes metadata in json export when requested', async () => {
    mockMetaRepo.findByItemId.mockResolvedValue({ itemId: 'i1', purpose: 'task', tags: ['work'], updatedAt: '' });
    const service = new ExportService(mockNoteRepo, mockItemRepo, mockMetaRepo, mockSnapshotRepo);
    const result = await service.export('note-1', { format: 'json', includeMetadata: true });
    const payload = JSON.parse(result.payload);
    expect(payload.items[0].metadata).toBeDefined();
    expect(payload.items[0].metadata.purpose).toBe('task');
  });

  it('generates a valid sha256 checksum', async () => {
    const service = new ExportService(mockNoteRepo, mockItemRepo, mockMetaRepo, mockSnapshotRepo);
    const result = await service.export('note-1', { format: 'json', includeMetadata: false });
    const expected = createHash('sha256').update(result.payload).digest('hex');
    expect(result.snapshot.checksum).toBe(expected);
  });

  it('exports note as markdown', async () => {
    const service = new ExportService(mockNoteRepo, mockItemRepo, mockMetaRepo, mockSnapshotRepo);
    const result = await service.export('note-1', { format: 'markdown', includeMetadata: false });
    expect(result.payload).toContain('# My Note');
    expect(result.payload).toContain('Item one');
  });

  it('sets payloadSizeBytes correctly', async () => {
    const service = new ExportService(mockNoteRepo, mockItemRepo, mockMetaRepo, mockSnapshotRepo);
    const result = await service.export('note-1', { format: 'json', includeMetadata: false });
    expect(result.snapshot.payloadSizeBytes).toBe(Buffer.byteLength(result.payload));
  });
});
