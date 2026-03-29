import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unlinkSync, existsSync } from 'node:fs';

const testDbPath = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require('node:os');
  const p = path.join(os.tmpdir(), `server-shutdown-test-${process.pid}.db`);
  process.env['SQLITE_DB_PATH'] = p;
  process.env['NODE_ENV'] = 'test';
  return p;
});

import { buildServer } from '../../src/server.js';
import { runMigrations } from '../../src/db/migrate.js';

describe('Server Graceful Shutdown', () => {
  beforeAll(() => {
    runMigrations(testDbPath);
  });

  afterAll(() => {
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
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
    // After close, the server should no longer accept inject requests
    await expect(
      server.inject({ method: 'GET', url: '/health' })
    ).rejects.toThrow();
  });
});
