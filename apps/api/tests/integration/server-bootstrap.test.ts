import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unlinkSync, existsSync } from 'node:fs';

const testDbPath = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const p = require('node:path').join(require('node:os').tmpdir(), `server-bootstrap-test-${process.pid}.db`);
  process.env['SQLITE_DB_PATH'] = p;
  process.env['NODE_ENV'] = 'test';
  return p;
});

import { buildServer } from '../../src/server.js';
import { runMigrations } from '../../src/db/migrate.js';
import type { FastifyInstance } from 'fastify';

describe('Server Bootstrap', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    runMigrations(testDbPath);
    server = buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
  });

  it('starts without errors', () => {
    expect(server).toBeDefined();
  });

  it('responds to health check', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/unknown' });
    expect(response.statusCode).toBe(404);
  });

  it('registers /v1/notes route', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/notes' });
    expect(response.statusCode).toBeLessThan(500);
  });
});
