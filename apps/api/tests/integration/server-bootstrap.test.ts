import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../../src/server.js';
import type { FastifyInstance } from 'fastify';

process.env['SQLITE_DB_PATH'] = ':memory:';
process.env['NODE_ENV'] = 'test';

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

  it('returns 404 for unknown routes', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/unknown' });
    expect(response.statusCode).toBe(404);
  });

  it('registers /v1/notes route', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/notes' });
    expect(response.statusCode).toBeLessThan(500);
  });
});
