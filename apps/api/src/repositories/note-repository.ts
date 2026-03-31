import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceNote } from 'shared-types';
import { readNoteFile, writeNoteFile, listNoteFiles, removeNoteFilesById } from '../storage/file-client.js';
import { extractNoteIdFromFileName } from '../storage/sanitize.js';
import type { NoteFile } from '../storage/note-file-schema.js';
import { basename } from 'node:path';

export type { WorkspaceNote };

export interface CreateNoteInput {
  title: string;
  description?: string;
}

export interface UpdateNoteInput {
  title?: string;
  description?: string;
  viewMode?: 'tree' | 'focus';
  version: number;
}

export class NoteRepository {
  constructor(private readonly notesDir: string) {}

  async findAll(): Promise<WorkspaceNote[]> {
    const files = listNoteFiles(this.notesDir);
    const notes: WorkspaceNote[] = [];
    for (const filePath of files) {
      const note = readNoteFile(filePath);
      if (note) notes.push(toNote(note));
    }
    notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return notes;
  }

  async findById(id: string): Promise<WorkspaceNote | null> {
    const noteFile = this.findNoteFileById(id);
    return noteFile ? toNote(noteFile) : null;
  }

  async create(input: CreateNoteInput): Promise<WorkspaceNote> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const noteFile: NoteFile = {
      id,
      title: input.title.trim(),
      description: input.description ?? null,
      viewMode: 'tree',
      version: 1,
      createdAt: now,
      updatedAt: now,
      items: [],
    };
    writeNoteFile(this.notesDir, noteFile);
    return toNote(noteFile);
  }

  async update(id: string, input: UpdateNoteInput): Promise<WorkspaceNote | null> {
    const noteFile = this.findNoteFileById(id);
    if (!noteFile) return null;

    if (noteFile.version !== input.version) {
      const err = Object.assign(new Error('Version conflict'), { statusCode: 409 });
      throw err;
    }

    const now = new Date().toISOString();
    const titleChanged = input.title !== undefined && input.title.trim() !== noteFile.title;

    // If title changed, remove old file first
    if (titleChanged) {
      removeNoteFilesById(this.notesDir, id);
    }

    const updated: NoteFile = {
      ...noteFile,
      title: input.title !== undefined ? input.title.trim() : noteFile.title,
      description: input.description !== undefined ? (input.description ?? null) : noteFile.description,
      viewMode: input.viewMode ?? noteFile.viewMode,
      version: noteFile.version + 1,
      updatedAt: now,
    };
    writeNoteFile(this.notesDir, updated);
    return toNote(updated);
  }

  async delete(id: string): Promise<void> {
    removeNoteFilesById(this.notesDir, id);
  }

  /** Read the raw NoteFile for a given note ID (used by item/metadata repos) */
  findNoteFileById(id: string): NoteFile | null {
    const files = listNoteFiles(this.notesDir);
    for (const filePath of files) {
      const fileId = extractNoteIdFromFileName(basename(filePath));
      if (fileId === id) {
        return readNoteFile(filePath);
      }
    }
    return null;
  }

  /** Write a NoteFile back (used by item/metadata repos) */
  writeNoteFileBack(noteFile: NoteFile): void {
    removeNoteFilesById(this.notesDir, noteFile.id);
    writeNoteFile(this.notesDir, noteFile);
  }
}

function toNote(noteFile: NoteFile): WorkspaceNote {
  return {
    id: noteFile.id,
    title: noteFile.title,
    description: noteFile.description ?? undefined,
    viewMode: noteFile.viewMode,
    version: noteFile.version,
    archived: false,
    createdAt: noteFile.createdAt,
    updatedAt: noteFile.updatedAt,
  };
}
