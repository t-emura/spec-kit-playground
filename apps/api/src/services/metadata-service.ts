import type { MetadataRepository } from '../repositories/metadata-repository.js';
import type { ItemRepository } from '../repositories/item-repository.js';
import type { ItemMetadata } from 'shared-types';

function notFound(id: string): never {
  throw Object.assign(new Error(`Item not found: ${id}`), { statusCode: 404 });
}

export class MetadataService {
  constructor(
    private readonly metaRepo: MetadataRepository,
    private readonly itemRepo: ItemRepository,
  ) {}

  async getMetadata(itemId: string): Promise<ItemMetadata | null> {
    return this.metaRepo.findByItemId(itemId);
  }

  async upsertMetadata(itemId: string, input: unknown): Promise<ItemMetadata> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) notFound(itemId);
    return this.metaRepo.upsert(itemId, input);
  }
}
