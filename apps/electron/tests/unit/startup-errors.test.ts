import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    accessSync: vi.fn(),
  };
});

import { existsSync, accessSync } from 'fs';
import { checkStaticDir, checkDbWritable } from '../../startup-checks.js';

const mockShowErrorBox = vi.fn();
const mockQuit = vi.fn();
const mockDeps = {
  dialog: { showErrorBox: mockShowErrorBox },
  app: { quit: mockQuit },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('checkStaticDir', () => {
  it('returns true when STATIC_DIR exists', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const result = checkStaticDir('/valid/path', mockDeps);
    expect(result).toBe(true);
    expect(mockShowErrorBox).not.toHaveBeenCalled();
    expect(mockQuit).not.toHaveBeenCalled();
  });

  it('shows error dialog and quits when STATIC_DIR is missing', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const result = checkStaticDir('/missing/path', mockDeps);
    expect(result).toBe(false);
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      '起動エラー',
      expect.stringContaining('npm run build')
    );
    expect(mockQuit).toHaveBeenCalledOnce();
  });
});

describe('checkDbWritable', () => {
  it('returns true when DB dir is writable', () => {
    vi.mocked(accessSync).mockReturnValue(undefined);
    const result = checkDbWritable('/writable/dir', mockDeps);
    expect(result).toBe(true);
    expect(mockShowErrorBox).not.toHaveBeenCalled();
    expect(mockQuit).not.toHaveBeenCalled();
  });

  it('shows error dialog and quits when DB dir is not writable', () => {
    const err = Object.assign(new Error('EACCES'), { code: 'EACCES' });
    vi.mocked(accessSync).mockImplementation(() => { throw err; });
    const result = checkDbWritable('/readonly/dir', mockDeps);
    expect(result).toBe(false);
    expect(mockShowErrorBox).toHaveBeenCalledWith(
      '起動エラー',
      expect.stringContaining('/readonly/dir')
    );
    expect(mockQuit).toHaveBeenCalledOnce();
  });
});
