import { z } from 'zod';

const metadataSchema = z.object({
  purpose: z.enum(['idea', 'task', 'question', 'decision', 'reference']),
  category: z.string().max(60).nullable().optional(),
  tags: z.array(z.string()).default([]),
  contextNote: z.string().max(2000).nullable().optional(),
  confidence: z.number().int().min(0).max(100).nullable().optional(),
});

export type FileMetadata = z.infer<typeof metadataSchema>;

export interface FileItem {
  id: string;
  orderIndex: number;
  content: string;
  status: 'active' | 'done' | 'blocked';
  highlightLevel: 'none' | 'low' | 'medium' | 'high';
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: FileMetadata | null;
  children: FileItem[];
}

const itemSchema: z.ZodType<FileItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    orderIndex: z.number().int().min(0),
    content: z.string(),
    status: z.enum(['active', 'done', 'blocked']),
    highlightLevel: z.enum(['none', 'low', 'medium', 'high']),
    isCollapsed: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: metadataSchema.nullable().default(null),
    children: z.array(z.lazy(() => itemSchema)).default([]),
  }) as unknown as z.ZodType<FileItem>,
);

export const noteFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().default(null),
  viewMode: z.enum(['tree', 'focus']).default('tree'),
  version: z.number().int().min(1).default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(itemSchema).default([]),
});

export type NoteFile = z.infer<typeof noteFileSchema>;
