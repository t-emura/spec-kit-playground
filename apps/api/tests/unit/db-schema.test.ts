import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const migrationPath = join(__dirname, '../../src/db/migrations/0001_initial.sql');
  const migration = readFileSync(migrationPath, 'utf-8');
  db.exec(migration);
  return db;
}

describe('DB Schema: migration integrity', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeAll(() => {
    db = createTestDb();
  });

  afterAll(() => {
    db.close();
  });

  it('creates the notes table with required columns', () => {
    const info = db.prepare("PRAGMA table_info(notes)").all() as Array<{ name: string }>;
    const columns = info.map((c) => c.name);
    expect(columns).toContain('id');
    expect(columns).toContain('title');
    expect(columns).toContain('view_mode');
    expect(columns).toContain('version');
    expect(columns).toContain('archived');
  });

  it('creates the items table with required columns', () => {
    const info = db.prepare("PRAGMA table_info(items)").all() as Array<{ name: string }>;
    const columns = info.map((c) => c.name);
    expect(columns).toContain('id');
    expect(columns).toContain('note_id');
    expect(columns).toContain('parent_id');
    expect(columns).toContain('order_index');
    expect(columns).toContain('depth');
    expect(columns).toContain('is_collapsed');
    expect(columns).toContain('highlight_level');
    expect(columns).toContain('status');
  });

  it('creates the item_metadata table', () => {
    const info = db.prepare("PRAGMA table_info(item_metadata)").all() as Array<{ name: string }>;
    const columns = info.map((c) => c.name);
    expect(columns).toContain('item_id');
    expect(columns).toContain('purpose');
    expect(columns).toContain('tags');
  });

  it('creates the export_snapshots table', () => {
    const info = db.prepare("PRAGMA table_info(export_snapshots)").all() as Array<{ name: string }>;
    const columns = info.map((c) => c.name);
    expect(columns).toContain('id');
    expect(columns).toContain('note_id');
    expect(columns).toContain('checksum');
    expect(columns).toContain('payload_size_bytes');
  });

  it('enforces title length constraint', () => {
    const now = new Date().toISOString();
    const id = randomUUID();
    expect(() => {
      db.prepare(
        `INSERT INTO notes(id, title, view_mode, version, created_at, updated_at) VALUES (?, ?, 'tree', 1, ?, ?)`
      ).run(id, '', now, now);
    }).toThrow();
  });

  it('enforces depth constraint (max 10)', () => {
    const now = new Date().toISOString();
    const noteId = randomUUID();
    const itemId = randomUUID();
    db.prepare(
      `INSERT INTO notes(id, title, view_mode, version, created_at, updated_at) VALUES (?, 'Test', 'tree', 1, ?, ?)`
    ).run(noteId, now, now);

    expect(() => {
      db.prepare(
        `INSERT INTO items(id, note_id, order_index, depth, content, created_at, updated_at) VALUES (?, ?, 0, 11, 'x', ?, ?)`
      ).run(itemId, noteId, now, now);
    }).toThrow();
  });

  it('cascades deletion of items when note is deleted', () => {
    const now = new Date().toISOString();
    const noteId = randomUUID();
    const itemId = randomUUID();

    db.prepare(
      `INSERT INTO notes(id, title, view_mode, version, created_at, updated_at) VALUES (?, 'Cascade Test', 'tree', 1, ?, ?)`
    ).run(noteId, now, now);
    db.prepare(
      `INSERT INTO items(id, note_id, order_index, depth, content, created_at, updated_at) VALUES (?, ?, 0, 0, 'item', ?, ?)`
    ).run(itemId, noteId, now, now);

    db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);

    const items = db.prepare('SELECT * FROM items WHERE id = ?').all(itemId);
    expect(items).toHaveLength(0);
  });
});
