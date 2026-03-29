import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api-client.js', () => ({
  apiClient: {
    search: {
      query: vi.fn().mockResolvedValue({
        items: [
          { id: 'i1', content: 'Search result one', noteId: 'n1', orderIndex: 0, depth: 0, isCollapsed: false, highlightLevel: 'none', status: 'active', createdAt: '', updatedAt: '' },
          { id: 'i2', content: 'Search result two', noteId: 'n1', orderIndex: 1, depth: 0, isCollapsed: false, highlightLevel: 'none', status: 'active', createdAt: '', updatedAt: '' },
        ],
        query: 'result',
        total: 2,
      }),
    },
    items: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('SearchPanel Component', () => {
  it('renders a search input', async () => {
    const { SearchPanel } = await import('../../src/features/search/components/search-panel.js');
    render(<SearchPanel noteId="n1" onResultSelect={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toBeDefined();
  });

  it('shows results after search', async () => {
    const { SearchPanel } = await import('../../src/features/search/components/search-panel.js');
    const user = userEvent.setup();
    render(<SearchPanel noteId="n1" onResultSelect={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'result');
    await waitFor(() => {
      expect(screen.getByText('Search result one')).toBeDefined();
    });
  });

  it('calls onResultSelect when a result is clicked', async () => {
    const { SearchPanel } = await import('../../src/features/search/components/search-panel.js');
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SearchPanel noteId="n1" onResultSelect={onSelect} />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'result');
    await waitFor(() => screen.getByText('Search result one'));
    await user.click(screen.getByText('Search result one'));
    expect(onSelect).toHaveBeenCalledWith('i1', 'result');
  });

  it('shows result count', async () => {
    const { SearchPanel } = await import('../../src/features/search/components/search-panel.js');
    const user = userEvent.setup();
    render(<SearchPanel noteId="n1" onResultSelect={vi.fn()} />);
    await user.type(screen.getByRole('searchbox'), 'result');
    await waitFor(() => {
      expect(screen.getByText(/2/)).toBeDefined();
    });
  });
});
