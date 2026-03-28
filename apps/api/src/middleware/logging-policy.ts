import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

/** Log field policy: redacts sensitive fields before they reach log output */
const REDACTED_FIELDS = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'password',
  'token',
  'secret',
]);

export function applyLoggingPolicy(server: FastifyInstance): void {
  server.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    const redactedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      redactedHeaders[key] = REDACTED_FIELDS.has(key.toLowerCase()) ? '[REDACTED]' : (value as string);
    }
    request.log.info({ method: request.method, url: request.url }, 'incoming request');
  });

  server.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info(
      { method: request.method, url: request.url, statusCode: reply.statusCode },
      'request completed',
    );
  });
}
