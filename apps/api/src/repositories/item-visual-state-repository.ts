import { eq } from 'drizzle-orm';
import { items } from '../db/schema.js';
import type { DB } from '../db/client.js';
import type { OutlineItem, HighlightLevel } from 'shared-types';

export class ItemVisualStateRepository {
  constructor(private readonly db: DB) {}

  async updateHighlight(itemId: string, level: HighlightLevel): Promise<OutlineItem | null> {
    const existing = await this.db.select().from(items).where(eq(items.id, itemId));
    if (existing.length === 0) return null;

    const now = new Date().toISOString();
    await this.db
      .update(items)
      .set({ highlightLevel: level, updatedAt: now })
      .where(eq(items.id, itemId));

    const updated = await this.db.select().from(items).where(eq(items.id, itemId));
    const row = updated[0]!;
    return {
      id: row.id,
      noteId: row.noteId,
      parentId: row.parentId,
      orderIndex: row.orderIndex,
      depth: row.depth,
      content: row.content,
      isCollapsed: row.isCollapsed,
      highlightLevel: row.highlightLevel,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
