import { createHash } from 'node:crypto';
import type { NoteRepository } from '../repositories/note-repository.js';
import type { ItemRepository } from '../repositories/item-repository.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import type { ExportSnapshotRepository } from '../repositories/export-snapshot-repository.js';
import type { ExportResult, ExportFormat } from 'shared-types';

function notFound(id: string): never {
  throw Object.assign(new Error(`Note not found: ${id}`), { statusCode: 404 });
}

export class ExportService {
  constructor(
    private readonly noteRepo: NoteRepository,
    private readonly itemRepo: ItemRepository,
    private readonly metaRepo: MetadataRepository,
    private readonly snapshotRepo: ExportSnapshotRepository,
  ) {}

  async export(noteId: string, options: { format: ExportFormat; includeMetadata: boolean }): Promise<ExportResult> {
    const note = await this.noteRepo.findById(noteId);
    if (!note) notFound(noteId);

    const items = await this.itemRepo.findByNoteId(noteId);

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (options.includeMetadata) {
          const metadata = await this.metaRepo.findByItemId(item.id);
          return metadata ? { ...item, metadata } : item;
        }
        return item;
      }),
    );

    const payload = options.format === 'json'
      ? JSON.stringify({ note, items: enrichedItems }, null, 2)
      : this.toMarkdown(note.title, enrichedItems);

    const checksum = createHash('sha256').update(payload).digest('hex');
    const payloadSizeBytes = Buffer.byteLength(payload);

    const snapshot = await this.snapshotRepo.create({
      noteId,
      format: options.format,
      includeMetadata: options.includeMetadata,
      checksum,
      payloadSizeBytes,
    });

    return { snapshot, payload };
  }

  private toMarkdown(title: string, items: Array<{ content: string; depth: number; metadata?: unknown }>): string {
    const lines = [`# ${title}`, ''];
    for (const item of items) {
      const indent = '  '.repeat(item.depth);
      lines.push(`${indent}- ${item.content}`);
    }
    return lines.join('\n');
  }
}
