import { z } from 'zod';
import type { ItemRepository } from '../repositories/item-repository.js';
import type { ItemVisualStateRepository } from '../repositories/item-visual-state-repository.js';
import type { OutlineItem } from 'shared-types';

const updateHighlightSchema = z.object({
  highlightLevel: z.enum(['none', 'low', 'medium', 'high']),
});

function notFound(id: string): never {
  throw Object.assign(new Error(`Item not found: ${id}`), { statusCode: 404 });
}

export class ItemHighlightService {
  constructor(
    private readonly itemRepo: ItemRepository,
    private readonly visualStateRepo: ItemVisualStateRepository,
  ) {}

  async updateHighlight(itemId: string, input: unknown): Promise<OutlineItem> {
    const { highlightLevel } = updateHighlightSchema.parse(input);
    const updated = await this.visualStateRepo.updateHighlight(itemId, highlightLevel);
    if (!updated) notFound(itemId);
    return updated;
  }
}
