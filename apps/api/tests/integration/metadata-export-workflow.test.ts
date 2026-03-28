import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import * as schema from '../../src/db/schema.js';
import { NoteRepository } from '../../src/repositories/note-repository.js';
import { ItemRepository } from '../../src/repositories/item-repository.js';
import { MetadataRepository } from '../../src/repositories/metadata-repository.js';
import { ExportSnapshotRepository } from '../../src/repositories/export-snapshot-repository.js';
import { NoteService } from '../../src/services/note-service.js';
import { ItemService } from '../../src/services/item-service.js';
import { MetadataService } from '../../src/services/metadata-service.js';
import { ExportService } from '../../src/services/export-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return drizzle(sqlite, { schema });
}

describe('Metadata Upsert to Persistence and Export', () => {
  let db: ReturnType<typeof createTestDb>;
  let noteService: NoteService;
  let itemService: ItemService;
  let metadataService: MetadataService;
  let exportService: ExportService;
  let noteId: string;
  let itemId: string;

  beforeEach(async () => {
    db = createTestDb();
    const noteRepo = new NoteRepository(db);
    const itemRepo = new ItemRepository(db);
    const metaRepo = new MetadataRepository(db);
    const snapshotRepo = new ExportSnapshotRepository(db);
    noteService = new NoteService(noteRepo);
    itemService = new ItemService(itemRepo, noteRepo);
    metadataService = new MetadataService(metaRepo, itemRepo);
    exportService = new ExportService(noteRepo, itemRepo, metaRepo, snapshotRepo);

    const note = await noteService.createNote({ title: 'Metadata Test' });
    noteId = note.id;
    const item = await itemService.createItem(noteId, { content: 'Tagged item', orderIndex: 0, depth: 0 });
    itemId = item.id;
  });

  it('upserts metadata and persists it', async () => {
    const meta = await metadataService.upsertMetadata(itemId, {
      purpose: 'task',
      tags: ['ai', 'backend'],
      contextNote: 'Important context',
    });
    expect(meta.purpose).toBe('task');
    expect(meta.tags).toContain('ai');
  });

  it('exports note with metadata included', async () => {
    await metadataService.upsertMetadata(itemId, { purpose: 'idea', tags: ['research'] });
    const result = await exportService.export(noteId, { format: 'json', includeMetadata: true });
    const payload = JSON.parse(result.payload);
    const exportedItem = payload.items.find((i: any) => i.id === itemId);
    expect(exportedItem.metadata).toBeDefined();
    expect(exportedItem.metadata.purpose).toBe('idea');
  });

  it('exports note without metadata when flag is false', async () => {
    await metadataService.upsertMetadata(itemId, { purpose: 'idea', tags: [] });
    const result = await exportService.export(noteId, { format: 'json', includeMetadata: false });
    const payload = JSON.parse(result.payload);
    const exportedItem = payload.items.find((i: any) => i.id === itemId);
    expect(exportedItem.metadata).toBeUndefined();
  });

  it('creates an export snapshot with valid checksum', async () => {
    const result = await exportService.export(noteId, { format: 'json', includeMetadata: true });
    expect(result.snapshot.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(result.snapshot.payloadSizeBytes).toBeGreaterThan(0);
  });
});
