import { eq } from 'drizzle-orm';
import { itemMetadata } from '../db/schema.js';
import type { DB } from '../db/client.js';
import type { ItemMetadata } from 'shared-types';
import { upsertMetadataSchema } from '../schemas/metadata-schema.js';

export class MetadataRepository {
  constructor(private readonly db: DB) {}

  async findByItemId(itemId: string): Promise<ItemMetadata | null> {
    const rows = await this.db.select().from(itemMetadata).where(eq(itemMetadata.itemId, itemId));
    if (rows.length === 0) return null;
    return toMetadata(rows[0]!);
  }

  async upsert(itemId: string, input: unknown): Promise<ItemMetadata> {
    const data = upsertMetadataSchema.parse(input);
    const now = new Date().toISOString();

    const existing = await this.findByItemId(itemId);
    if (existing) {
      await this.db
        .update(itemMetadata)
        .set({
          purpose: data.purpose,
          category: data.category ?? null,
          tags: data.tags,
          contextNote: data.contextNote ?? null,
          confidence: data.confidence ?? null,
          updatedAt: now,
        })
        .where(eq(itemMetadata.itemId, itemId));
    } else {
      await this.db.insert(itemMetadata).values({
        itemId,
        purpose: data.purpose,
        category: data.category ?? null,
        tags: data.tags,
        contextNote: data.contextNote ?? null,
        confidence: data.confidence ?? null,
        updatedAt: now,
      });
    }

    return (await this.findByItemId(itemId))!;
  }
}

function toMetadata(row: typeof itemMetadata.$inferSelect): ItemMetadata {
  return {
    itemId: row.itemId,
    purpose: row.purpose,
    category: row.category ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    contextNote: row.contextNote ?? undefined,
    confidence: row.confidence ?? undefined,
    updatedAt: row.updatedAt,
  };
}
