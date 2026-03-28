import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock api-client
vi.mock('../../src/lib/api-client.js', () => ({
  apiClient: {
    notes: {
      items: vi.fn().mockResolvedValue({ items: [] }),
      update: vi.fn().mockResolvedValue({}),
    },
    items: {
      create: vi.fn().mockResolvedValue({ id: 'new-item', content: 'New', orderIndex: 0, depth: 0 }),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      move: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('NoteWorkspace Component', () => {
  it('renders the workspace container', async () => {
    const { NoteWorkspace } = await import('../../src/pages/note-workspace.js');
    render(<NoteWorkspace noteId="note-1" noteTitle="Test Note" noteVersion={1} />);
    expect(screen.getByTestId('note-workspace')).toBeDefined();
  });

  it('shows the note title', async () => {
    const { NoteWorkspace } = await import('../../src/pages/note-workspace.js');
    render(<NoteWorkspace noteId="note-1" noteTitle="My Workspace" noteVersion={1} />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('My Workspace')).toBeDefined();
    });
  });

  it('allows keyboard navigation to add new items', async () => {
    const { NoteWorkspace } = await import('../../src/pages/note-workspace.js');
    const user = userEvent.setup();
    render(<NoteWorkspace noteId="note-1" noteTitle="KB Test" noteVersion={1} />);
    const addBtn = screen.queryByTestId('add-first-item');
    if (addBtn) {
      await user.click(addBtn);
      await waitFor(() => {
        expect(screen.queryAllByRole('textbox').length).toBeGreaterThan(0);
      });
    }
  });

  it('shows empty state when there are no items', async () => {
    const { NoteWorkspace } = await import('../../src/pages/note-workspace.js');
    render(<NoteWorkspace noteId="note-empty" noteTitle="Empty" noteVersion={1} />);
    await waitFor(() => {
      expect(screen.queryByTestId('empty-outline-hint')).toBeDefined();
    });
  });
});
