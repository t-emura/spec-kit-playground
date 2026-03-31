import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NoteRepository } from '../../../src/repositories/note-repository.js';
import { ItemRepository } from '../../../src/repositories/item-repository.js';
import { MetadataRepository } from '../../../src/repositories/metadata-repository.js';

let tmpDir: string;
let noteRepo: NoteRepository;
let itemRepo: ItemRepository;
let metaRepo: MetadataRepository;
let itemId: string;

beforeEach(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), 'meta-repo-test-'));
  noteRepo = new NoteRepository(tmpDir);
  itemRepo = new ItemRepository(tmpDir, noteRepo);
  metaRepo = new MetadataRepository(tmpDir, noteRepo);
  const note = await noteRepo.create({ title: 'Note' });
  const item = await itemRepo.create(note.id, { content: 'content', orderIndex: 0, depth: 0 });
  itemId = item.id;
});
afterEach(() => rmSync(tmpDir, { recursive: true }));

describe('MetadataRepository', () => {
  it('returns null when no metadata exists', async () => {
    const result = await metaRepo.findByItemId(itemId);
    expect(result).toBeNull();
  });

  it('returns null for non-existent item', async () => {
    const result = await metaRepo.findByItemId('non-existent');
    expect(result).toBeNull();
  });

  it('upserts metadata for a new item', async () => {
    const meta = await metaRepo.upsert(itemId, {
      purpose: 'task',
      tags: ['work', 'urgent'],
    });
    expect(meta.purpose).toBe('task');
    expect(meta.tags).toContain('work');
  });

  it('updates existing metadata on upsert', async () => {
    await metaRepo.upsert(itemId, { purpose: 'idea', tags: [] });
    const updated = await metaRepo.upsert(itemId, { purpose: 'decision', tags: ['final'] });
    expect(updated.purpose).toBe('decision');
    expect(updated.tags).toContain('final');
  });

  it('finds metadata by itemId', async () => {
    await metaRepo.upsert(itemId, { purpose: 'question', tags: ['research'] });
    const found = await metaRepo.findByItemId(itemId);
    expect(found).toBeDefined();
    expect(found!.purpose).toBe('question');
  });

  it('validates tags are not duplicated', async () => {
    await expect(
      metaRepo.upsert(itemId, { purpose: 'idea', tags: ['dup', 'dup'] }),
    ).rejects.toThrow();
  });

  it('validates category length', async () => {
    await expect(
      metaRepo.upsert(itemId, { purpose: 'idea', tags: [], category: 'x'.repeat(61) }),
    ).rejects.toThrow();
  });

  it('stores confidence value', async () => {
    const meta = await metaRepo.upsert(itemId, { purpose: 'idea', tags: [], confidence: 85 });
    expect(meta.confidence).toBe(85);
  });
});
