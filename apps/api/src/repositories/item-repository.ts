import { v4 as uuidv4 } from 'uuid';
import type { OutlineItem, HighlightLevel, ItemStatus } from 'shared-types';
import type { NoteRepository } from './note-repository.js';
import type { FileItem, NoteFile } from '../storage/note-file-schema.js';
import { listNoteFiles, readNoteFile } from '../storage/file-client.js';

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

export class ItemRepository {
  constructor(
    private readonly notesDir: string,
    private readonly noteRepo: NoteRepository,
  ) {}

  async findByNoteId(noteId: string): Promise<OutlineItem[]> {
    const noteFile = this.noteRepo.findNoteFileById(noteId);
    if (!noteFile) return [];
    return flattenItems(noteFile.items, noteId);
  }

  async searchItems(noteId: string, query: string): Promise<OutlineItem[]> {
    const all = await this.findByNoteId(noteId);
    const lower = query.toLowerCase();
    return all.filter((item) => item.content.toLowerCase().includes(lower));
  }

  async findById(id: string): Promise<OutlineItem | null> {
    const { noteFile, item } = this.findItemInAllNotes(id) ?? {};
    if (!noteFile || !item) return null;
    return fileItemToOutlineItem(item, noteFile.id, findParentId(noteFile.items, id), findDepth(noteFile.items, id));
  }

  async create(noteId: string, input: CreateItemInput): Promise<OutlineItem> {
    const noteFile = this.noteRepo.findNoteFileById(noteId);
    if (!noteFile) throw Object.assign(new Error(`Note not found: ${noteId}`), { statusCode: 404 });

    const now = new Date().toISOString();
    const id = uuidv4();
    const newItem: FileItem = {
      id,
      orderIndex: input.orderIndex,
      content: input.content,
      status: 'active',
      highlightLevel: 'none',
      isCollapsed: false,
      createdAt: now,
      updatedAt: now,
      metadata: null,
      children: [],
    };

    if (input.parentId) {
      const parent = findItemById(noteFile.items, input.parentId);
      if (!parent) throw Object.assign(new Error(`Parent not found: ${input.parentId}`), { statusCode: 404 });
      // Shift existing siblings
      for (const child of parent.children) {
        if (child.orderIndex >= input.orderIndex) child.orderIndex++;
      }
      parent.children.push(newItem);
      parent.children.sort((a, b) => a.orderIndex - b.orderIndex);
    } else {
      // Root-level item
      for (const item of noteFile.items) {
        if (item.orderIndex >= input.orderIndex) item.orderIndex++;
      }
      noteFile.items.push(newItem);
      noteFile.items.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    this.noteRepo.writeNoteFileBack(noteFile);
    return fileItemToOutlineItem(newItem, noteId, input.parentId ?? null, input.depth);
  }

  async update(id: string, input: UpdateItemInput): Promise<OutlineItem | null> {
    const result = this.findItemInAllNotes(id);
    if (!result) return null;

    const { noteFile, item } = result;
    const now = new Date().toISOString();
    if (input.content !== undefined) item.content = input.content;
    if (input.isCollapsed !== undefined) item.isCollapsed = input.isCollapsed;
    if (input.highlightLevel !== undefined) item.highlightLevel = input.highlightLevel;
    if (input.status !== undefined) item.status = input.status;
    item.updatedAt = now;

    this.noteRepo.writeNoteFileBack(noteFile);
    return fileItemToOutlineItem(item, noteFile.id, findParentId(noteFile.items, id), findDepth(noteFile.items, id));
  }

  async delete(id: string): Promise<void> {
    const result = this.findItemInAllNotes(id);
    if (!result) return;

    const { noteFile } = result;
    removeItemById(noteFile.items, id);
    this.noteRepo.writeNoteFileBack(noteFile);
  }

  async move(id: string, input: MoveItemInput): Promise<OutlineItem | null> {
    const result = this.findItemInAllNotes(id);
    if (!result) return null;

    const { noteFile } = result;
    // Remove item from current position
    const removed = extractItemById(noteFile.items, id);
    if (!removed) return null;

    const targetParentId = input.targetParentId !== undefined ? input.targetParentId : findParentId(noteFile.items, id);

    // Insert at new position
    if (targetParentId) {
      const parent = findItemById(noteFile.items, targetParentId);
      if (!parent) return null;
      for (const child of parent.children) {
        if (child.orderIndex >= input.targetOrderIndex) child.orderIndex++;
      }
      removed.orderIndex = input.targetOrderIndex;
      parent.children.push(removed);
      parent.children.sort((a, b) => a.orderIndex - b.orderIndex);
    } else {
      for (const item of noteFile.items) {
        if (item.orderIndex >= input.targetOrderIndex) item.orderIndex++;
      }
      removed.orderIndex = input.targetOrderIndex;
      noteFile.items.push(removed);
      noteFile.items.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    removed.updatedAt = new Date().toISOString();
    this.noteRepo.writeNoteFileBack(noteFile);

    const depth = targetParentId ? findDepth(noteFile.items, id) : 0;
    return fileItemToOutlineItem(removed, noteFile.id, targetParentId ?? null, depth);
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

// Helper functions for tree manipulation

function findItemById(items: FileItem[], id: string): FileItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItemById(item.children, id);
    if (found) return found;
  }
  return null;
}

function findParentId(items: FileItem[], targetId: string): string | null {
  for (const item of items) {
    for (const child of item.children) {
      if (child.id === targetId) return item.id;
      const found = findParentId(item.children, targetId);
      if (found !== undefined) return found;
    }
  }
  return null;
}

function findDepth(items: FileItem[], targetId: string, currentDepth = 0): number {
  for (const item of items) {
    if (item.id === targetId) return currentDepth;
    const depth = findDepth(item.children, targetId, currentDepth + 1);
    if (depth >= 0) return depth;
  }
  return -1;
}

function removeItemById(items: FileItem[], id: string): boolean {
  const idx = items.findIndex((item) => item.id === id);
  if (idx >= 0) {
    items.splice(idx, 1);
    return true;
  }
  for (const item of items) {
    if (removeItemById(item.children, id)) return true;
  }
  return false;
}

function extractItemById(items: FileItem[], id: string): FileItem | null {
  const idx = items.findIndex((item) => item.id === id);
  if (idx >= 0) return items.splice(idx, 1)[0]!;
  for (const item of items) {
    const found = extractItemById(item.children, id);
    if (found) return found;
  }
  return null;
}

function flattenItems(items: FileItem[], noteId: string, parentId: string | null = null, depth = 0): OutlineItem[] {
  const result: OutlineItem[] = [];
  for (const item of items) {
    result.push(fileItemToOutlineItem(item, noteId, parentId, depth));
    result.push(...flattenItems(item.children, noteId, item.id, depth + 1));
  }
  return result;
}

function fileItemToOutlineItem(item: FileItem, noteId: string, parentId: string | null, depth: number): OutlineItem {
  return {
    id: item.id,
    noteId,
    parentId,
    orderIndex: item.orderIndex,
    depth,
    content: item.content,
    isCollapsed: item.isCollapsed,
    highlightLevel: item.highlightLevel,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
