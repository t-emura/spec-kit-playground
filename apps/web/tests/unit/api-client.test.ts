import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('api-client BASE_URL resolution', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ notes: [], total: 0 }),
      })
    );
  });

  it('uses window.electron.apiBase when Electron context is present', async () => {
    vi.stubGlobal('window', { electron: { apiBase: 'http://127.0.0.1:12345' } });

    const { apiClient } = await import('../../src/lib/api-client.js');
    await apiClient.notes.list();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://127.0.0.1:12345/v1/notes'),
      expect.any(Object)
    );
  });

  it('falls back to localhost:8787 when window.electron is undefined', async () => {
    vi.stubGlobal('window', {});

    const { apiClient } = await import('../../src/lib/api-client.js');
    await apiClient.notes.list();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/localhost:8787\/v1\/notes/),
      expect.any(Object)
    );
  });
});
