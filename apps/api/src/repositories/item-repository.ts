import { eq, asc, and, gte, lte, sql, like, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { items } from '../db/schema.js';
import type { DB } from '../db/client.js';
import type { OutlineItem, HighlightLevel, ItemStatus } from 'shared-types';

export type { OutlineItem };

export interface CreateItemInput {
  parentId?: string | null;
  content: string;
  orderIndex: number;
  depth: number;
}

export interface UpdateItemInput {
  content?: string;
  isCollapsed?: boolean;
  highlightLevel?: HighlightLevel;
  status?: ItemStatus;
}

export interface MoveItemInput {
  targetParentId?: string | null;
  targetOrderIndex: number;
}

function parentEq(value: string | null | undefined) {
  return value == null ? isNull(items.parentId) : eq(items.parentId, value);
}

export class ItemRepository {
  constructor(private readonly db: DB) {}

  async findByNoteId(noteId: string): Promise<OutlineItem[]> {
    const rows = await this.db
      .select()
      .from(items)
      .where(eq(items.noteId, noteId))
      .orderBy(asc(items.orderIndex));
    return rows.map(toItem);
  }

  async searchItems(noteId: string, query: string): Promise<OutlineItem[]> {
    const rows = await this.db
      .select()
      .from(items)
      .where(and(eq(items.noteId, noteId), like(items.content, `%${query}%`)))
      .orderBy(asc(items.orderIndex));
    return rows.map(toItem);
  }

  async findById(id: string): Promise<OutlineItem | null> {
    const rows = await this.db.select().from(items).where(eq(items.id, id));
    if (rows.length === 0) return null;
    return toItem(rows[0]!);
  }

  async create(noteId: string, input: CreateItemInput): Promise<OutlineItem> {
    const now = new Date().toISOString();
    const id = uuidv4();

    // Shift existing items to make space for the new one
    await this.db
      .update(items)
      .set({ orderIndex: sql`${items.orderIndex} + 1`, updatedAt: now })
      .where(
        and(
          eq(items.noteId, noteId),
          parentEq(input.parentId),
          gte(items.orderIndex, input.orderIndex),
        ),
      );

    await this.db.insert(items).values({
      id,
      noteId,
      parentId: input.parentId ?? null,
      orderIndex: input.orderIndex,
      depth: input.depth,
      content: input.content,
      isCollapsed: false,
      highlightLevel: 'none',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateItemInput): Promise<OutlineItem | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    await this.db
      .update(items)
      .set({
        content: input.content ?? existing.content,
        isCollapsed: input.isCollapsed ?? existing.isCollapsed,
        highlightLevel: input.highlightLevel ?? existing.highlightLevel,
        status: input.status ?? existing.status,
        updatedAt: now,
      })
      .where(eq(items.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    // Cascade handled by FK constraint, but also delete descendants manually for safety
    await this.deleteDescendants(id);
    await this.db.delete(items).where(eq(items.id, id));
  }

  private async deleteDescendants(parentId: string): Promise<void> {
    const children = await this.db.select().from(items).where(eq(items.parentId, parentId));
    for (const child of children) {
      await this.deleteDescendants(child.id);
      await this.db.delete(items).where(eq(items.id, child.id));
    }
  }

  async move(id: string, input: MoveItemInput): Promise<OutlineItem | null> {
    const item = await this.findById(id);
    if (!item) return null;

    const now = new Date().toISOString();
    const targetParentId = input.targetParentId !== undefined ? input.targetParentId : item.parentId;
    const targetDepth = targetParentId === null ? 0 : await this.getDepthForParent(targetParentId, item);

    // Remove from old position (shift items down)
    await this.db
      .update(items)
      .set({ orderIndex: sql`${items.orderIndex} - 1`, updatedAt: now })
      .where(
        and(
          eq(items.noteId, item.noteId),
          parentEq(item.parentId),
          gte(items.orderIndex, item.orderIndex),
        ),
      );

    // Shift items at target position up
    await this.db
      .update(items)
      .set({ orderIndex: sql`${items.orderIndex} + 1`, updatedAt: now })
      .where(
        and(
          eq(items.noteId, item.noteId),
          parentEq(targetParentId),
          gte(items.orderIndex, input.targetOrderIndex),
        ),
      );

    await this.db
      .update(items)
      .set({
        parentId: targetParentId,
        orderIndex: input.targetOrderIndex,
        depth: targetDepth,
        updatedAt: now,
      })
      .where(eq(items.id, id));

    return this.findById(id);
  }

  private async getDepthForParent(parentId: string, _item: OutlineItem): Promise<number> {
    const parent = await this.findById(parentId);
    return parent ? parent.depth + 1 : 0;
  }
}

function toItem(row: typeof items.$inferSelect): OutlineItem {
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
