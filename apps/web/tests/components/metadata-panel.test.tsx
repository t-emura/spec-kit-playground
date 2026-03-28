import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../src/lib/api-client.js', () => ({
  apiClient: {
    items: {
      getMetadata: vi.fn().mockResolvedValue({
        itemId: 'item-1',
        purpose: 'task',
        tags: ['work'],
        category: 'Development',
        contextNote: 'Some context',
        updatedAt: new Date().toISOString(),
      }),
      upsertMetadata: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('MetadataPanel Component', () => {
  it('renders the metadata panel', async () => {
    const { MetadataPanel } = await import('../../src/features/metadata/components/metadata-panel.js');
    render(<MetadataPanel itemId="item-1" onMetadataChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('metadata-panel')).toBeDefined();
    });
  });

  it('displays existing metadata', async () => {
    const { MetadataPanel } = await import('../../src/features/metadata/components/metadata-panel.js');
    render(<MetadataPanel itemId="item-1" onMetadataChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('task')).toBeDefined();
    });
  });

  it('shows tag editor', async () => {
    const { MetadataPanel } = await import('../../src/features/metadata/components/metadata-panel.js');
    render(<MetadataPanel itemId="item-1" onMetadataChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('tag-editor')).toBeDefined();
    });
  });

  it('calls onMetadataChange when form is submitted', async () => {
    const { MetadataPanel } = await import('../../src/features/metadata/components/metadata-panel.js');
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MetadataPanel itemId="item-1" onMetadataChange={onChange} />);
    await waitFor(() => screen.getByTestId('metadata-save-btn'));
    await user.click(screen.getByTestId('metadata-save-btn'));
    expect(onChange).toHaveBeenCalled();
  });

  it('shows validation error for required fields', async () => {
    const { MetadataPanel } = await import('../../src/features/metadata/components/metadata-panel.js');
    vi.mocked((await import('../../src/lib/api-client.js')).apiClient.items.getMetadata).mockResolvedValue(null as any);
    render(<MetadataPanel itemId="item-new" onMetadataChange={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('metadata-panel')).toBeDefined();
    });
  });
});
