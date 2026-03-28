import { z } from 'zod';
import type { NoteRepository } from '../repositories/note-repository.js';
import type { WorkspaceNote } from 'shared-types';

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120).transform((s) => s.trim()),
  description: z.string().max(500).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(120).transform((s) => s.trim()).optional(),
  description: z.string().max(500).optional(),
  viewMode: z.enum(['tree', 'focus']).optional(),
  version: z.number().int().positive(),
});

function notFound(id: string): never {
  throw Object.assign(new Error(`Note not found: ${id}`), { statusCode: 404 });
}

export class NoteService {
  constructor(private readonly repo: NoteRepository) {}

  async listNotes(): Promise<WorkspaceNote[]> {
    return this.repo.findAll();
  }

  async getNoteById(id: string): Promise<WorkspaceNote> {
    const note = await this.repo.findById(id);
    if (!note) notFound(id);
    return note;
  }

  async createNote(input: unknown): Promise<WorkspaceNote> {
    const data = createSchema.parse(input);
    return this.repo.create(data);
  }

  async updateNote(id: string, input: unknown): Promise<WorkspaceNote> {
    const data = updateSchema.parse(input);
    const existing = await this.repo.findById(id);
    if (!existing) notFound(id);
    if (existing.archived) {
      throw Object.assign(new Error('Cannot update archived note'), { statusCode: 400 });
    }
    const updated = await this.repo.update(id, data);
    if (!updated) notFound(id);
    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) notFound(id);
    return this.repo.delete(id);
  }
}
