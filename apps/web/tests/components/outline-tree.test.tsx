import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutlineTree } from '../../src/features/outliner/components/outline-tree.js';
import type { OutlineItem } from 'shared-types';

const mockItems: OutlineItem[] = [
  {
    id: 'item-1', noteId: 'note-1', parentId: null, orderIndex: 0, depth: 0,
    content: 'First item', isCollapsed: false, highlightLevel: 'none', status: 'active',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-2', noteId: 'note-1', parentId: 'item-1', orderIndex: 0, depth: 1,
    content: 'Child item', isCollapsed: false, highlightLevel: 'none', status: 'active',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

describe('OutlineTree Component', () => {
  it('renders items', () => {
    render(
      <OutlineTree
        items={mockItems}
        onItemChange={async () => {}}
        onItemMove={async () => {}}
        onItemDelete={async () => {}}
        onItemCreate={async () => mockItems[0]!}
      />
    );
    expect(screen.getByDisplayValue('First item')).toBeDefined();
    expect(screen.getByDisplayValue('Child item')).toBeDefined();
  });

  it('renders indented child items', () => {
    render(
      <OutlineTree
        items={mockItems}
        onItemChange={async () => {}}
        onItemMove={async () => {}}
        onItemDelete={async () => {}}
        onItemCreate={async () => mockItems[0]!}
      />
    );
    const childEl = screen.getByDisplayValue('Child item').closest('[data-depth]');
    expect(childEl?.getAttribute('data-depth')).toBe('1');
  });

  it('calls onItemChange when content is edited', async () => {
    const onChange = vi.fn().mockResolvedValue(undefined);
    render(
      <OutlineTree
        items={mockItems}
        onItemChange={onChange}
        onItemMove={async () => {}}
        onItemDelete={async () => {}}
        onItemCreate={async () => mockItems[0]!}
      />
    );
    const input = screen.getAllByRole('textbox')[0]!;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Modified' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalled();
  });

  it('renders collapse toggle for parent items', () => {
    render(
      <OutlineTree
        items={mockItems}
        onItemChange={async () => {}}
        onItemMove={async () => {}}
        onItemDelete={async () => {}}
        onItemCreate={async () => mockItems[0]!}
      />
    );
    const toggle = screen.getByTestId('collapse-toggle-item-1');
    expect(toggle).toBeDefined();
  });

  it('hides children when parent is collapsed', () => {
    const collapsedItems = mockItems.map((i) =>
      i.id === 'item-1' ? { ...i, isCollapsed: true } : i
    );
    render(
      <OutlineTree
        items={collapsedItems}
        onItemChange={async () => {}}
        onItemMove={async () => {}}
        onItemDelete={async () => {}}
        onItemCreate={async () => mockItems[0]!}
      />
    );
    expect(screen.queryByDisplayValue('Child item')).toBeNull();
  });

  it('applies highlight level class', () => {
    const highlighted = mockItems.map((i) =>
      i.id === 'item-1' ? { ...i, highlightLevel: 'high' as const } : i
    );
    render(
      <OutlineTree
        items={highlighted}
        onItemChange={async () => {}}
        onItemMove={async () => {}}
        onItemDelete={async () => {}}
        onItemCreate={async () => mockItems[0]!}
      />
    );
    const el = screen.getByDisplayValue('First item').closest('[data-highlight]');
    expect(el?.getAttribute('data-highlight')).toBe('high');
  });
});
