import type { ItemMetadata } from 'shared-types';
import type { NoteRepository } from './note-repository.js';
import type { FileItem, NoteFile } from '../storage/note-file-schema.js';
import { listNoteFiles, readNoteFile } from '../storage/file-client.js';
import { upsertMetadataSchema } from '../schemas/metadata-schema.js';

export class MetadataRepository {
  constructor(
    private readonly notesDir: string,
    private readonly noteRepo: NoteRepository,
  ) {}

  async findByItemId(itemId: string): Promise<ItemMetadata | null> {
    const result = this.findItemInAllNotes(itemId);
    if (!result) return null;
    const { item } = result;
    if (!item.metadata) return null;
    return toMetadata(itemId, item);
  }

  async upsert(itemId: string, input: unknown): Promise<ItemMetadata> {
    const data = upsertMetadataSchema.parse(input);
    const now = new Date().toISOString();

    const result = this.findItemInAllNotes(itemId);
    if (!result) throw Object.assign(new Error(`Item not found: ${itemId}`), { statusCode: 404 });

    const { noteFile, item } = result;
    item.metadata = {
      purpose: data.purpose,
      category: data.category ?? null,
      tags: data.tags,
      contextNote: data.contextNote ?? null,
      confidence: data.confidence ?? null,
    };
    item.updatedAt = now;

    this.noteRepo.writeNoteFileBack(noteFile);
    return toMetadata(itemId, item);
  }

  private findItemInAllNotes(itemId: string): { noteFile: NoteFile; item: FileItem } | null {
    const files = listNoteFiles(this.notesDir);
    for (const filePath of files) {
      const noteFile = readNoteFile(filePath);
      if (!noteFile) continue;
      const item = findItemById(noteFile.items, itemId);
      if (item) return { noteFile, item };
    }
    return null;
  }
}

function findItemById(items: FileItem[], id: string): FileItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItemById(item.children, id);
    if (found) return found;
  }
  return null;
}

function toMetadata(itemId: string, item: FileItem): ItemMetadata {
  const meta = item.metadata!;
  return {
    itemId,
    purpose: meta.purpose,
    category: meta.category ?? undefined,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    contextNote: meta.contextNote ?? undefined,
    confidence: meta.confidence ?? undefined,
    updatedAt: item.updatedAt,
  };
}
