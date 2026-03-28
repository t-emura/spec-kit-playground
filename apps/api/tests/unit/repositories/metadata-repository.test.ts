import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import * as schema from '../../../src/db/schema.js';
import { MetadataRepository } from '../../../src/repositories/metadata-repository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return { db: drizzle(sqlite, { schema }), sqlite };
}

function seedItem(sqlite: any): string {
  const now = new Date().toISOString();
  const noteId = randomUUID();
  const itemId = randomUUID();
  sqlite.prepare(`INSERT INTO notes(id, title, view_mode, version, created_at, updated_at) VALUES (?, 'Note', 'tree', 1, ?, ?)`).run(noteId, now, now);
  sqlite.prepare(`INSERT INTO items(id, note_id, order_index, depth, content, created_at, updated_at) VALUES (?, ?, 0, 0, 'content', ?, ?)`).run(itemId, noteId, now, now);
  return itemId;
}

describe('MetadataRepository', () => {
  let db: ReturnType<typeof createTestDb>['db'];
  let sqlite: any;
  let itemId: string;

  beforeEach(() => {
    const result = createTestDb();
    db = result.db;
    sqlite = result.sqlite;
    itemId = seedItem(sqlite);
  });

  it('upserts metadata for a new item', async () => {
    const repo = new MetadataRepository(db);
    const meta = await repo.upsert(itemId, {
      purpose: 'task',
      tags: ['work', 'urgent'],
    });
    expect(meta.purpose).toBe('task');
    expect(meta.tags).toContain('work');
  });

  it('updates existing metadata on upsert', async () => {
    const repo = new MetadataRepository(db);
    await repo.upsert(itemId, { purpose: 'idea', tags: [] });
    const updated = await repo.upsert(itemId, { purpose: 'decision', tags: ['final'] });
    expect(updated.purpose).toBe('decision');
    expect(updated.tags).toContain('final');
  });

  it('finds metadata by itemId', async () => {
    const repo = new MetadataRepository(db);
    await repo.upsert(itemId, { purpose: 'question', tags: ['research'] });
    const found = await repo.findByItemId(itemId);
    expect(found).toBeDefined();
    expect(found!.purpose).toBe('question');
  });

  it('returns null for missing metadata', async () => {
    const repo = new MetadataRepository(db);
    const result = await repo.findByItemId('non-existent');
    expect(result).toBeNull();
  });

  it('validates tags are not duplicated', async () => {
    const repo = new MetadataRepository(db);
    await expect(
      repo.upsert(itemId, { purpose: 'idea', tags: ['dup', 'dup'] })
    ).rejects.toThrow();
  });

  it('validates category length', async () => {
    const repo = new MetadataRepository(db);
    await expect(
      repo.upsert(itemId, { purpose: 'idea', tags: [], category: 'x'.repeat(61) })
    ).rejects.toThrow();
  });

  it('stores confidence value', async () => {
    const repo = new MetadataRepository(db);
    const meta = await repo.upsert(itemId, { purpose: 'idea', tags: [], confidence: 85 });
    expect(meta.confidence).toBe(85);
  });
});
