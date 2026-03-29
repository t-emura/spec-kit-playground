import { z } from 'zod';
import type { ItemRepository } from '../repositories/item-repository.js';
import type { NoteRepository } from '../repositories/note-repository.js';
import type { OutlineItem } from 'shared-types';

const createSchema = z.object({
  parentId: z.string().nullable().optional(),
  content: z.string().max(2000).default(''),
  orderIndex: z.number().int().min(0),
  depth: z.number().int().min(0).max(10),
});

const updateSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  isCollapsed: z.boolean().optional(),
  highlightLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'done', 'blocked']).optional(),
});

const moveSchema = z.object({
  targetParentId: z.string().nullable().optional(),
  targetOrderIndex: z.number().int().min(0),
});

function notFound(id: string): never {
  throw Object.assign(new Error(`Item not found: ${id}`), { statusCode: 404 });
}

export class ItemService {
  constructor(
    private readonly itemRepo: ItemRepository,
    private readonly noteRepo: NoteRepository,
  ) {}

  async getItemTree(noteId: string): Promise<OutlineItem[]> {
    return this.itemRepo.findByNoteId(noteId);
  }

  async createItem(noteId: string, input: unknown): Promise<OutlineItem> {
    const data = createSchema.parse(input);
    return this.itemRepo.create(noteId, data);
  }

  async updateItem(id: string, input: unknown): Promise<OutlineItem> {
    const data = updateSchema.parse(input);
    const existing = await this.itemRepo.findById(id);
    if (!existing) notFound(id);
    const updated = await this.itemRepo.update(id, data);
    if (!updated) notFound(id);
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const existing = await this.itemRepo.findById(id);
    if (!existing) notFound(id);
    return this.itemRepo.delete(id);
  }

  async moveItem(id: string, input: unknown): Promise<OutlineItem> {
    const data = moveSchema.parse(input);
    const existing = await this.itemRepo.findById(id);
    if (!existing) notFound(id);
    const moved = await this.itemRepo.move(id, data);
    if (!moved) notFound(id);
    return moved;
  }

  async indentItem(id: string): Promise<OutlineItem> {
    const item = await this.itemRepo.findById(id);
    if (!item) notFound(id);

    const siblings = await this.itemRepo.findByNoteId(item.noteId);
    const prevSibling = siblings
      .filter((s) => s.parentId === item.parentId && s.orderIndex < item.orderIndex)
      .sort((a, b) => b.orderIndex - a.orderIndex)[0];

    if (!prevSibling) {
      throw Object.assign(new Error('Cannot indent: no previous sibling'), { statusCode: 400 });
    }

    const childrenOfPrev = siblings.filter((s) => s.parentId === prevSibling.id);
    const newOrderIndex = childrenOfPrev.length;

    return this.moveItem(id, { targetParentId: prevSibling.id, targetOrderIndex: newOrderIndex });
  }

  async outdentItem(id: string): Promise<OutlineItem> {
    const item = await this.itemRepo.findById(id);
    if (!item) notFound(id);
    if (!item.parentId) {
      throw Object.assign(new Error('Cannot outdent: already at root level'), { statusCode: 400 });
    }

    const parent = await this.itemRepo.findById(item.parentId);
    if (!parent) notFound(item.parentId);

    const siblings = await this.itemRepo.findByNoteId(item.noteId);
    const _afterParent = siblings
      .filter((s) => s.parentId === parent.parentId && s.orderIndex > parent.orderIndex)
      .map((s) => s.orderIndex);
    const newOrderIndex = parent.orderIndex + 1;

    return this.moveItem(id, { targetParentId: parent.parentId, targetOrderIndex: newOrderIndex });
  }
}
