import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ItemVisualStateRepository', () => {
  let ItemVisualStateRepository: any;
  let db: any;

  beforeEach(async () => {
    const Database = (await import('better-sqlite3')).default;
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const schema = await import('../../../src/db/schema.js');
    const module = await import('../../../src/repositories/item-visual-state-repository.js');
    ItemVisualStateRepository = module.ItemVisualStateRepository;

    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const migration = readFileSync(join(__dirname, '../../../src/db/migrations/0001_initial.sql'), 'utf-8');
    sqlite.exec(migration);
    db = drizzle(sqlite, { schema });

    // Seed a note and item for FK constraints
    const { randomUUID } = await import('node:crypto');
    const now = new Date().toISOString();
    const noteId = randomUUID();
    const itemId = 'test-item-1';
    sqlite.prepare(`INSERT INTO notes(id, title, view_mode, version, created_at, updated_at) VALUES (?, 'Note', 'tree', 1, ?, ?)`).run(noteId, now, now);
    sqlite.prepare(`INSERT INTO items(id, note_id, order_index, depth, content, created_at, updated_at) VALUES (?, ?, 0, 0, 'content', ?, ?)`).run(itemId, noteId, now, now);
  });

  it('updates highlight level of an item', async () => {
    const repo = new ItemVisualStateRepository(db);
    const updated = await repo.updateHighlight('test-item-1', 'high');
    expect(updated.highlightLevel).toBe('high');
  });

  it('resets highlight level to none', async () => {
    const repo = new ItemVisualStateRepository(db);
    await repo.updateHighlight('test-item-1', 'high');
    const reset = await repo.updateHighlight('test-item-1', 'none');
    expect(reset.highlightLevel).toBe('none');
  });

  it('returns null for non-existent item', async () => {
    const repo = new ItemVisualStateRepository(db);
    const result = await repo.updateHighlight('non-existent', 'high');
    expect(result).toBeNull();
  });
});
