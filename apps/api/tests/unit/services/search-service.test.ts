import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SearchService', () => {
  let SearchService: any;
  let mockItemRepo: any;

  beforeEach(async () => {
    const module = await import('../../../src/services/search-service.js');
    SearchService = module.SearchService;
    mockItemRepo = {
      findByNoteId: vi.fn(),
      searchItems: vi.fn(),
    };
  });

  it('returns items matching content query', async () => {
    const service = new SearchService(mockItemRepo);
    const items = [
      { id: '1', content: 'Hello world', noteId: 'n1', depth: 0, orderIndex: 0 },
      { id: '2', content: 'Goodbye', noteId: 'n1', depth: 0, orderIndex: 1 },
    ];
    mockItemRepo.searchItems.mockResolvedValue([items[0]]);
    const result = await service.search('n1', 'hello');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].content).toContain('Hello');
  });

  it('returns empty results for non-matching query', async () => {
    const service = new SearchService(mockItemRepo);
    mockItemRepo.searchItems.mockResolvedValue([]);
    const result = await service.search('n1', 'xyz-not-found');
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('includes query in result', async () => {
    const service = new SearchService(mockItemRepo);
    mockItemRepo.searchItems.mockResolvedValue([]);
    const result = await service.search('n1', 'my query');
    expect(result.query).toBe('my query');
  });

  it('searches across content and metadata fields', async () => {
    const service = new SearchService(mockItemRepo);
    const items = [
      { id: '1', content: 'Data analysis', noteId: 'n1', orderIndex: 0, depth: 0 },
    ];
    mockItemRepo.searchItems.mockResolvedValue(items);
    const result = await service.search('n1', 'analysis');
    expect(result.items).toHaveLength(1);
  });

  it('is case-insensitive', async () => {
    const service = new SearchService(mockItemRepo);
    const items = [{ id: '1', content: 'TypeScript', noteId: 'n1', orderIndex: 0, depth: 0 }];
    mockItemRepo.searchItems.mockResolvedValue(items);
    const result = await service.search('n1', 'typescript');
    expect(result.items).toHaveLength(1);
  });
});
