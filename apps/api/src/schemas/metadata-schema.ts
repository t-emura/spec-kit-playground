import { z } from 'zod';

export const upsertMetadataSchema = z
  .object({
    purpose: z.enum(['idea', 'task', 'question', 'decision', 'reference']),
    category: z.string().max(60).optional(),
    tags: z
      .array(z.string().min(1).max(24))
      .max(20)
      .refine((tags) => new Set(tags).size === tags.length, 'Tags must be unique'),
    contextNote: z.string().max(2000).optional(),
    confidence: z.number().int().min(0).max(100).optional(),
  });

export const metadataSchema = upsertMetadataSchema.extend({
  itemId: z.string().uuid(),
  updatedAt: z.string(),
});

export type UpsertMetadataInput = z.infer<typeof upsertMetadataSchema>;
export type MetadataRecord = z.infer<typeof metadataSchema>;
