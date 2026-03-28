import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
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

  return server;
}
