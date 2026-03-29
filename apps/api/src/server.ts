import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notesRoutes } from './routes/notes-routes.js';
import { itemsRoutes } from './routes/items-routes.js';
import { searchRoutes } from './routes/search-routes.js';
import { metadataExportRoutes } from './routes/metadata-export-routes.js';

export function buildServer() {
  const server = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization', 'req.body.password'],
    },
  });

  server.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : true,
  });
  server.register(sensible);

  server.setErrorHandler(errorHandler);

  server.register(notesRoutes, { prefix: '/v1' });
  server.register(itemsRoutes, { prefix: '/v1' });
  server.register(searchRoutes, { prefix: '/v1' });
  server.register(metadataExportRoutes, { prefix: '/v1' });

  server.get('/health', async () => ({ status: 'ok' }));

  // Register static file serving only when STATIC_DIR exists (set by Electron main process)
  if (existsSync(resolve(env.STATIC_DIR))) {
    server.register(fastifyStatic, {
      root: resolve(env.STATIC_DIR),
      prefix: '/',
      wildcard: false,
    });
    // SPA fallback: serve index.html for non-API routes
    server.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/v1/')) {
        void reply.status(404).send({ message: 'Not Found' });
        return;
      }
      void reply.sendFile('index.html');
    });
  }

  return server;
}
