import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NoteRepository } from '../../src/repositories/note-repository.js';
import { ItemRepository } from '../../src/repositories/item-repository.js';
import { MetadataRepository } from '../../src/repositories/metadata-repository.js';
import { NoteService } from '../../src/services/note-service.js';
import { ItemService } from '../../src/services/item-service.js';
import { MetadataService } from '../../src/services/metadata-service.js';

let tmpDir: string;
let noteService: NoteService;
let itemService: ItemService;
let metadataService: MetadataService;
let noteId: string;
let itemId: string;

describe('Metadata Upsert and Persistence', () => {
  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'meta-workflow-'));
    const noteRepo = new NoteRepository(tmpDir);
    const itemRepo = new ItemRepository(tmpDir, noteRepo);
    const metaRepo = new MetadataRepository(tmpDir, noteRepo);
    noteService = new NoteService(noteRepo);
    itemService = new ItemService(itemRepo, noteRepo);
    metadataService = new MetadataService(metaRepo, itemRepo);

    const note = await noteService.createNote({ title: 'Metadata Test' });
    noteId = note.id;
    const item = await itemService.createItem(noteId, { content: 'Tagged item', orderIndex: 0, depth: 0 });
    itemId = item.id;
  });

  afterEach(() => rmSync(tmpDir, { recursive: true }));

  it('upserts metadata and persists it', async () => {
    const meta = await metadataService.upsertMetadata(itemId, {
      purpose: 'task',
      tags: ['ai', 'backend'],
      contextNote: 'Important context',
    });
    expect(meta.purpose).toBe('task');
    expect(meta.tags).toContain('ai');
  });

  it('retrieves metadata after upsert', async () => {
    await metadataService.upsertMetadata(itemId, { purpose: 'idea', tags: ['research'] });
    const found = await metadataService.getMetadata(itemId);
    expect(found).toBeDefined();
    expect(found!.purpose).toBe('idea');
    expect(found!.tags).toContain('research');
  });

  it('overwrites metadata on second upsert', async () => {
    await metadataService.upsertMetadata(itemId, { purpose: 'idea', tags: [] });
    const updated = await metadataService.upsertMetadata(itemId, { purpose: 'decision', tags: ['final'] });
    expect(updated.purpose).toBe('decision');
    expect(updated.tags).toContain('final');
  });

  it('returns null for item without metadata', async () => {
    const result = await metadataService.getMetadata(itemId);
    expect(result).toBeNull();
  });
});
