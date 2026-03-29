import type { ItemRepository } from '../repositories/item-repository.js';
import type { SearchResult } from 'shared-types';

export class SearchService {
  constructor(private readonly itemRepo: ItemRepository) {}

  async search(noteId: string, query: string): Promise<SearchResult> {
    const items = await this.itemRepo.searchItems(noteId, query);
    return {
      items,
      query,
      total: items.length,
    };
  }
}
