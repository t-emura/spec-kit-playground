import { vi, describe, it, expect, afterAll } from 'vitest';
import { rmSync } from 'node:fs';

const testEnv = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require('node:os');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs');
  const notesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-shutdown-test-'));
  process.env['NOTES_DIR'] = notesDir;
  process.env['NODE_ENV'] = 'test';
  return { notesDir };
});

import { buildServer } from '../../src/server.js';

describe('Server Graceful Shutdown', () => {
  afterAll(() => {
    rmSync(testEnv.notesDir, { recursive: true, force: true });
  });

  it('closes cleanly without throwing', async () => {
    const server = buildServer();
    await server.ready();
    await server.listen({ port: 0, host: '127.0.0.1' });
    await expect(server.close()).resolves.not.toThrow();
  });

  it('rejects new requests after close', async () => {
    const server = buildServer();
    await server.ready();
    await server.listen({ port: 0, host: '127.0.0.1' });
    await server.close();
    await expect(
      server.inject({ method: 'GET', url: '/health' })
    ).rejects.toThrow();
  });
});
