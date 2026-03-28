import { describe, it, expect, beforeEach } from 'vitest';
import type { WorkspaceNote } from '../../../src/repositories/note-repository.js';

// Unit tests for note-repository - expectations define the interface
describe('NoteRepository', () => {
  it('should be importable and expose required methods', async () => {
    const { NoteRepository } = await import('../../../src/repositories/note-repository.js');
    const repo = new NoteRepository(undefined as any);
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
  });

  describe('with in-memory DB', () => {
    let db: any;
    let NoteRepository: any;

    beforeEach(async () => {
      const Database = (await import('better-sqlite3')).default;
      const { readFileSync } = await import('node:fs');
      const { join, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const { drizzle } = await import('drizzle-orm/better-sqlite3');
      const schema = await import('../../../src/db/schema.js');
      const module = await import('../../../src/repositories/note-repository.js');
      NoteRepository = module.NoteRepository;

      const sqlite = new Database(':memory:');
      sqlite.pragma('foreign_keys = ON');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const migration = readFileSync(join(__dirname, '../../../src/db/migrations/0001_initial.sql'), 'utf-8');
      sqlite.exec(migration);
      db = drizzle(sqlite, { schema });
    });

    it('creates a note and returns it with an id', async () => {
      const repo = new NoteRepository(db);
      const note = await repo.create({ title: 'Test Note' });
      expect(note.id).toBeDefined();
      expect(note.title).toBe('Test Note');
      expect(note.version).toBe(1);
      expect(note.archived).toBe(false);
    });

    it('finds all notes', async () => {
      const repo = new NoteRepository(db);
      await repo.create({ title: 'Note A' });
      await repo.create({ title: 'Note B' });
      const notes = await repo.findAll();
      expect(notes).toHaveLength(2);
    });

    it('finds a note by id', async () => {
      const repo = new NoteRepository(db);
      const created = await repo.create({ title: 'Find Me' });
      const found = await repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found!.title).toBe('Find Me');
    });

    it('returns null for non-existent id', async () => {
      const repo = new NoteRepository(db);
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });

    it('updates a note title', async () => {
      const repo = new NoteRepository(db);
      const note = await repo.create({ title: 'Original' });
      const updated = await repo.update(note.id, { title: 'Updated', version: 1 });
      expect(updated!.title).toBe('Updated');
      expect(updated!.version).toBe(2);
    });

    it('throws conflict error when version mismatches', async () => {
      const repo = new NoteRepository(db);
      const note = await repo.create({ title: 'Version Test' });
      await expect(repo.update(note.id, { title: 'New', version: 99 })).rejects.toThrow();
    });

    it('deletes a note', async () => {
      const repo = new NoteRepository(db);
      const note = await repo.create({ title: 'Delete Me' });
      await repo.delete(note.id);
      const found = await repo.findById(note.id);
      expect(found).toBeNull();
    });

    it('does not include archived notes in normal listing by default', async () => {
      const repo = new NoteRepository(db);
      await repo.create({ title: 'Active' });
      const allNotes = await repo.findAll();
      expect(allNotes.some((n: WorkspaceNote) => n.archived)).toBe(false);
    });
  });
});
