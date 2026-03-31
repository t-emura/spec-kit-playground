import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NoteRepository } from '../../../src/repositories/note-repository.js';
import type { WorkspaceNote } from '../../../src/repositories/note-repository.js';

let tmpDir: string;
let repo: NoteRepository;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'note-repo-test-'));
  repo = new NoteRepository(tmpDir);
});
afterEach(() => rmSync(tmpDir, { recursive: true }));

describe('NoteRepository', () => {
  it('findAll returns empty array initially', async () => {
    const notes = await repo.findAll();
    expect(notes).toEqual([]);
  });

  it('creates a note and returns it with an id', async () => {
    const note = await repo.create({ title: 'Test Note' });
    expect(note.id).toBeDefined();
    expect(note.title).toBe('Test Note');
    expect(note.version).toBe(1);
    expect(note.archived).toBe(false);
  });

  it('finds all notes', async () => {
    await repo.create({ title: 'Note A' });
    await repo.create({ title: 'Note B' });
    const notes = await repo.findAll();
    expect(notes).toHaveLength(2);
  });

  it('finds a note by id', async () => {
    const created = await repo.create({ title: 'Find Me' });
    const found = await repo.findById(created.id);
    expect(found).toBeDefined();
    expect(found!.title).toBe('Find Me');
  });

  it('returns null for non-existent id', async () => {
    const found = await repo.findById('non-existent');
    expect(found).toBeNull();
  });

  it('updates a note title', async () => {
    const note = await repo.create({ title: 'Original' });
    const updated = await repo.update(note.id, { title: 'Updated', version: 1 });
    expect(updated!.title).toBe('Updated');
    expect(updated!.version).toBe(2);
  });

  it('throws conflict error when version mismatches', async () => {
    const note = await repo.create({ title: 'Version Test' });
    await expect(repo.update(note.id, { title: 'New', version: 99 })).rejects.toThrow('Version conflict');
  });

  it('deletes a note', async () => {
    const note = await repo.create({ title: 'Delete Me' });
    await repo.delete(note.id);
    const found = await repo.findById(note.id);
    expect(found).toBeNull();
  });

  it('title change renames the file on disk', async () => {
    const note = await repo.create({ title: 'Original Title' });
    await repo.update(note.id, { title: 'Renamed Title', version: 1 });
    const files = readdirSync(tmpDir).filter((f) => f.endsWith('.json'));
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('Renamed Title');
    expect(files[0]).not.toContain('Original Title');
  });

  it('does not include archived notes in normal listing by default', async () => {
    await repo.create({ title: 'Active' });
    const allNotes = await repo.findAll();
    expect(allNotes.some((n: WorkspaceNote) => n.archived)).toBe(false);
  });
});
