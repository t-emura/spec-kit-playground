import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../src/db/schema.js';
import { NoteRepository } from '../../src/repositories/note-repository.js';
import { NoteService } from '../../src/services/note-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const migration = readFileSync(join(__dirname, '../../src/db/migrations/0001_initial.sql'), 'utf-8');
  sqlite.exec(migration);
  return drizzle(sqlite, { schema });
}

describe('Note Creation to Persistence Workflow', () => {
  let db: ReturnType<typeof createTestDb>;
  let noteService: NoteService;

  beforeAll(() => {
    db = createTestDb();
    const repo = new NoteRepository(db);
    noteService = new NoteService(repo);
  });

  it('creates a note and persists it', async () => {
    const note = await noteService.createNote({ title: 'My First Note' });
    expect(note.id).toBeDefined();
    expect(note.version).toBe(1);
  });

  it('retrieves the created note', async () => {
    const note = await noteService.createNote({ title: 'Persisted Note' });
    const found = await noteService.getNoteById(note.id);
    expect(found.title).toBe('Persisted Note');
  });

  it('increments version on each update', async () => {
    const note = await noteService.createNote({ title: 'Version Track' });
    const v2 = await noteService.updateNote(note.id, { title: 'Updated', version: 1 });
    expect(v2.version).toBe(2);
    const v3 = await noteService.updateNote(note.id, { title: 'Updated Again', version: 2 });
    expect(v3.version).toBe(3);
  });

  it('rejects update with stale version (optimistic lock)', async () => {
    const note = await noteService.createNote({ title: 'Concurrent Edit' });
    // Simulate concurrent update
    await noteService.updateNote(note.id, { title: 'Edit 1', version: 1 });
    // Now version is 2, but we try to update with version 1 again
    await expect(
      noteService.updateNote(note.id, { title: 'Edit 2 (stale)', version: 1 })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes a note', async () => {
    const note = await noteService.createNote({ title: 'Delete Me' });
    await noteService.deleteNote(note.id);
    await expect(noteService.getNoteById(note.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lists all notes', async () => {
    const initial = await noteService.listNotes();
    await noteService.createNote({ title: 'List Test A' });
    await noteService.createNote({ title: 'List Test B' });
    const after = await noteService.listNotes();
    expect(after.length).toBeGreaterThan(initial.length);
  });
});
