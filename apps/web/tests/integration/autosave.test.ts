import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock apiClient
vi.mock('../../src/lib/api-client.js', () => ({
  apiClient: {
    notes: {
      update: vi.fn(),
    },
  },
}));

describe('Autosave Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces save calls', async () => {
    const { apiClient } = await import('../../src/lib/api-client.js');
    const mockUpdate = vi.mocked(apiClient.notes.update).mockResolvedValue({} as any);

    const { useAutosave } = await import('../../src/features/outliner/hooks/use-autosave.js');
    const { result } = renderHook(() =>
      useAutosave({ noteId: 'note-1', version: 1 })
    );

    act(() => {
      result.current.scheduleAutosave({ title: 'Draft 1' });
      result.current.scheduleAutosave({ title: 'Draft 2' });
      result.current.scheduleAutosave({ title: 'Draft 3' });
    });

    // Fast-forward debounce delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should only have saved once (last value)
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('reports saving status', async () => {
    const { apiClient } = await import('../../src/lib/api-client.js');
    vi.mocked(apiClient.notes.update).mockResolvedValue({} as any);

    const { useAutosave } = await import('../../src/features/outliner/hooks/use-autosave.js');
    const { result } = renderHook(() =>
      useAutosave({ noteId: 'note-1', version: 1 })
    );

    expect(result.current.saveStatus).toBe('idle');
  });

  it('reports conflict on 409 response', async () => {
    const { apiClient } = await import('../../src/lib/api-client.js');
    const conflictError = Object.assign(new Error('Conflict'), { status: 409 });
    vi.mocked(apiClient.notes.update).mockRejectedValue(conflictError);

    const { useAutosave } = await import('../../src/features/outliner/hooks/use-autosave.js');
    const { result } = renderHook(() =>
      useAutosave({ noteId: 'note-1', version: 1 })
    );

    await act(async () => {
      result.current.scheduleAutosave({ title: 'Conflict Test' });
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.saveStatus).toBe('conflict');
  });
});
