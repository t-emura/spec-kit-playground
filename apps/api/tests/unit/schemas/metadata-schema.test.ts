import { describe, it, expect } from 'vitest';
import { metadataSchema, upsertMetadataSchema } from '../../../src/schemas/metadata-schema.js';

describe('Metadata Schema Validation', () => {
  it('validates valid metadata', () => {
    const result = upsertMetadataSchema.safeParse({
      purpose: 'task',
      tags: ['work', 'urgent'],
      category: 'Development',
      contextNote: 'This is important',
      confidence: 80,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid purpose', () => {
    const result = upsertMetadataSchema.safeParse({ purpose: 'invalid', tags: [] });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate tags', () => {
    const result = upsertMetadataSchema.safeParse({ purpose: 'idea', tags: ['dup', 'dup'] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 20 tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const result = upsertMetadataSchema.safeParse({ purpose: 'idea', tags });
    expect(result.success).toBe(false);
  });

  it('rejects tags longer than 24 chars', () => {
    const result = upsertMetadataSchema.safeParse({ purpose: 'idea', tags: ['a'.repeat(25)] });
    expect(result.success).toBe(false);
  });

  it('rejects category longer than 60 chars', () => {
    const result = upsertMetadataSchema.safeParse({ purpose: 'idea', tags: [], category: 'x'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('rejects contextNote longer than 2000 chars', () => {
    const result = upsertMetadataSchema.safeParse({
      purpose: 'idea',
      tags: [],
      contextNote: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence out of range', () => {
    const tooHigh = upsertMetadataSchema.safeParse({ purpose: 'idea', tags: [], confidence: 101 });
    const tooLow = upsertMetadataSchema.safeParse({ purpose: 'idea', tags: [], confidence: -1 });
    expect(tooHigh.success).toBe(false);
    expect(tooLow.success).toBe(false);
  });

  it('allows optional fields to be omitted', () => {
    const result = upsertMetadataSchema.safeParse({ purpose: 'reference', tags: [] });
    expect(result.success).toBe(true);
  });
});
