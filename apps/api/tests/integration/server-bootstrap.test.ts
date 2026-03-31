import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, rmSync } from 'node:fs';

const testEnv = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require('node:os');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs');

  const notesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
  const staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'static-test-'));
  const htmlContent = '<!DOCTYPE html><html><body>Test App</body></html>';
  fs.writeFileSync(path.join(staticDir, 'index.html'), htmlContent);

  process.env['NOTES_DIR'] = notesDir;
  process.env['NODE_ENV'] = 'test';
  process.env['STATIC_DIR'] = staticDir;

  return { notesDir, staticDir, htmlContent };
});

import { buildServer } from '../../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Server Bootstrap', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('starts without errors', () => {
    expect(server).toBeDefined();
  });

  it('responds to health check', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown API routes', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/unknown' });
    expect(response.statusCode).toBe(404);
  });

  it('registers /v1/notes route', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/notes' });
    expect(response.statusCode).toBeLessThan(500);
  });
});

// T016: Static file serving with STATIC_DIR
describe('Static File Serving', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    if (existsSync(testEnv.staticDir)) rmSync(testEnv.staticDir, { recursive: true });
    if (existsSync(testEnv.notesDir)) rmSync(testEnv.notesDir, { recursive: true });
  });

  it('serves index.html at GET /', async () => {
    const response = await server.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Test App');
  });

  it('serves index.html as SPA fallback for non-API routes', async () => {
    const response = await server.inject({ method: 'GET', url: '/some/spa/route' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Test App');
  });

  it('GET /v1/notes returns JSON', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/notes' });
    expect(response.statusCode).toBeLessThan(500);
    expect(response.headers['content-type']).toMatch(/json/);
  });
});

// T019c: EADDRINUSE scenario
describe('Port conflict (EADDRINUSE)', () => {
  it('throws EADDRINUSE when binding to an already-used port', async () => {
    const server1 = buildServer();
    await server1.ready();
    await server1.listen({ port: 0, host: '127.0.0.1' });
    const address = server1.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const server2 = buildServer();
    await server2.ready();

    await expect(
      server2.listen({ port, host: '127.0.0.1' }),
    ).rejects.toMatchObject({ code: 'EADDRINUSE' });

    await server1.close();
    await server2.close().catch(() => {});
  });
});
