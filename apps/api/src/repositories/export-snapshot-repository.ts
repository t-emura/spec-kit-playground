import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { exportSnapshots } from '../db/schema.js';
import type { DB } from '../db/client.js';
import type { ExportSnapshot } from 'shared-types';

export class ExportSnapshotRepository {
  constructor(private readonly db: DB) {}

  async create(input: Omit<ExportSnapshot, 'id' | 'createdAt'>): Promise<ExportSnapshot> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await this.db.insert(exportSnapshots).values({
      id,
      noteId: input.noteId,
      format: input.format,
      includeMetadata: input.includeMetadata,
      exportedBy: input.exportedBy ?? null,
      checksum: input.checksum,
      payloadSizeBytes: input.payloadSizeBytes,
      createdAt,
    });
    return { id, ...input, createdAt };
  }
}
