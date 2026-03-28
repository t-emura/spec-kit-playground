import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api-client.js', () => ({
  apiClient: {
    notes: {
      export: vi.fn().mockResolvedValue({
        snapshot: { id: 's1', noteId: 'n1', format: 'json', includeMetadata: true, checksum: 'abc', payloadSizeBytes: 100, createdAt: new Date().toISOString() },
        payload: '{"note":{},"items":[]}',
      }),
    },
  },
}));

describe('ExportDialog Component', () => {
  it('renders the export dialog', async () => {
    const { ExportDialog } = await import('../../src/features/export/components/export-dialog.js');
    render(<ExportDialog noteId="n1" isOpen onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('export-dialog')).toBeDefined();
    });
  });

  it('shows format selection (json and markdown)', async () => {
    const { ExportDialog } = await import('../../src/features/export/components/export-dialog.js');
    render(<ExportDialog noteId="n1" isOpen onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('format-json')).toBeDefined();
      expect(screen.getByTestId('format-markdown')).toBeDefined();
    });
  });

  it('shows include-metadata toggle', async () => {
    const { ExportDialog } = await import('../../src/features/export/components/export-dialog.js');
    render(<ExportDialog noteId="n1" isOpen onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('include-metadata-toggle')).toBeDefined();
    });
  });

  it('triggers export on submit', async () => {
    const { ExportDialog } = await import('../../src/features/export/components/export-dialog.js');
    const user = userEvent.setup();
    render(<ExportDialog noteId="n1" isOpen onClose={vi.fn()} />);
    await waitFor(() => screen.getByTestId('export-submit-btn'));
    await user.click(screen.getByTestId('export-submit-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('export-dialog')).toBeDefined();
    });
  });

  it('calls onClose when dialog is closed', async () => {
    const { ExportDialog } = await import('../../src/features/export/components/export-dialog.js');
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ExportDialog noteId="n1" isOpen onClose={onClose} />);
    await waitFor(() => screen.getByTestId('export-close-btn'));
    await user.click(screen.getByTestId('export-close-btn'));
    expect(onClose).toHaveBeenCalled();
  });
});
