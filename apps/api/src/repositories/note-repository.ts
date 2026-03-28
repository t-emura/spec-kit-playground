import { eq, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { notes } from '../db/schema.js';
import type { DB } from '../db/client.js';
import type { WorkspaceNote } from 'shared-types';

export type { WorkspaceNote };

export interface CreateNoteInput {
  title: string;
  description?: string;
}

export interface UpdateNoteInput {
  title?: string;
  description?: string;
  viewMode?: 'tree' | 'focus';
  version: number;
}

export class NoteRepository {
  constructor(private readonly db: DB) {}

  async findAll(): Promise<WorkspaceNote[]> {
    const rows = await this.db
      .select()
      .from(notes)
      .where(eq(notes.archived, false))
      .orderBy(asc(notes.createdAt));
    return rows.map(toNote);
  }

  async findById(id: string): Promise<WorkspaceNote | null> {
    const rows = await this.db.select().from(notes).where(eq(notes.id, id));
    if (rows.length === 0) return null;
    return toNote(rows[0]!);
  }

  async create(input: CreateNoteInput): Promise<WorkspaceNote> {
    const now = new Date().toISOString();
    const id = uuidv4();
    await this.db.insert(notes).values({
      id,
      title: input.title.trim(),
      description: input.description,
      viewMode: 'tree',
      version: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findById(id))!;
  }

  async update(id: string, input: UpdateNoteInput): Promise<WorkspaceNote | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    if (existing.version !== input.version) {
      const err = Object.assign(new Error('Version conflict'), { statusCode: 409 });
      throw err;
    }

    const now = new Date().toISOString();
    await this.db
      .update(notes)
      .set({
        title: input.title !== undefined ? input.title.trim() : existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        viewMode: input.viewMode ?? existing.viewMode,
        version: existing.version + 1,
        updatedAt: now,
      })
      .where(eq(notes.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(notes).where(eq(notes.id, id));
  }
}

function toNote(row: typeof notes.$inferSelect): WorkspaceNote {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    viewMode: row.viewMode,
    version: row.version,
    archived: row.archived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
