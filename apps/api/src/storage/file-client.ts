import { readFileSync, writeFileSync, unlinkSync, readdirSync, renameSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { noteFileSchema, type NoteFile } from './note-file-schema.js';
import { buildNoteFileName, extractNoteIdFromFileName } from './sanitize.js';

export function readNoteFile(filePath: string): NoteFile | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return noteFileSchema.parse(parsed);
  } catch (err) {
    console.error('[file-client] readNoteFile failed', { filePath, error: (err as Error).message });
    return null;
  }
}

export function writeNoteFile(dirPath: string, note: NoteFile): void {
  const fileName = buildNoteFileName(note.id, note.title);
  const targetPath = join(dirPath, fileName);
  const tmpPath = join(dirPath, `.tmp-${randomUUID()}.json`);
  try {
    writeFileSync(tmpPath, JSON.stringify(note, null, 2), 'utf-8');
    renameSync(tmpPath, targetPath);
  } catch (err) {
    console.error('[file-client] writeNoteFile failed', { dirPath, noteId: note.id, error: (err as Error).message });
    // Clean up temp file on failure
    try { unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

export function deleteNoteFile(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch (err) {
    console.error('[file-client] deleteNoteFile failed', { filePath, error: (err as Error).message });
    throw err;
  }
}

export function listNoteFiles(dirPath: string): string[] {
  try {
    mkdirSync(dirPath, { recursive: true });
    return readdirSync(dirPath)
      .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
      .map((f) => join(dirPath, f));
  } catch (err) {
    console.error('[file-client] listNoteFiles failed', { dirPath, error: (err as Error).message });
    return [];
  }
}

/**
 * Removes all JSON files for a given note ID from the directory.
 * Used when a note is renamed (old file must be cleaned up).
 */
export function removeNoteFilesById(dirPath: string, noteId: string): void {
  try {
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.json') && !f.startsWith('.'));
    for (const f of files) {
      if (extractNoteIdFromFileName(f) === noteId) {
        unlinkSync(join(dirPath, f));
      }
    }
  } catch (err) {
    console.error('[file-client] removeNoteFilesById failed', { dirPath, noteId, error: (err as Error).message });
  }
}
