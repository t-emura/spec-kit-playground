import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api-client.js', () => ({
  apiClient: {
    items: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

const mockItem = {
  id: 'item-1',
  noteId: 'note-1',
  parentId: null,
  orderIndex: 0,
  depth: 0,
  content: 'Test item',
  isCollapsed: false,
  highlightLevel: 'none' as const,
  status: 'active' as const,
  createdAt: '',
  updatedAt: '',
};

describe('FocusToolbar Component', () => {
  it('renders highlight level buttons', async () => {
    const { FocusToolbar } = await import('../../src/features/outliner/components/focus-toolbar.js');
    render(<FocusToolbar item={mockItem} onHighlightChange={vi.fn()} />);
    expect(screen.getByTestId('highlight-none')).toBeDefined();
    expect(screen.getByTestId('highlight-low')).toBeDefined();
    expect(screen.getByTestId('highlight-medium')).toBeDefined();
    expect(screen.getByTestId('highlight-high')).toBeDefined();
  });

  it('calls onHighlightChange when highlight level is selected', async () => {
    const { FocusToolbar } = await import('../../src/features/outliner/components/focus-toolbar.js');
    const onHighlight = vi.fn();
    const user = userEvent.setup();
    render(<FocusToolbar item={mockItem} onHighlightChange={onHighlight} />);
    await user.click(screen.getByTestId('highlight-high'));
    expect(onHighlight).toHaveBeenCalledWith('item-1', 'high');
  });

  it('shows active state for current highlight level', async () => {
    const { FocusToolbar } = await import('../../src/features/outliner/components/focus-toolbar.js');
    const highlighted = { ...mockItem, highlightLevel: 'medium' as const };
    render(<FocusToolbar item={highlighted} onHighlightChange={vi.fn()} />);
    const mediumBtn = screen.getByTestId('highlight-medium');
    expect(mediumBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows status toggle buttons', async () => {
    const { FocusToolbar } = await import('../../src/features/outliner/components/focus-toolbar.js');
    render(<FocusToolbar item={mockItem} onHighlightChange={vi.fn()} />);
    expect(screen.getByTestId('status-active')).toBeDefined();
    expect(screen.getByTestId('status-done')).toBeDefined();
    expect(screen.getByTestId('status-blocked')).toBeDefined();
  });
});
