import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { SearchService } from '../services/search-service.js';

export async function searchRoutes(server: FastifyInstance) {
  const itemRepo = new ItemRepository(db);
  const searchService = new SearchService(itemRepo);

  // GET /v1/notes/:noteId/search?q=...
  server.get(
    '/notes/:noteId/search',
    async (req: FastifyRequest<{ Params: { noteId: string }; Querystring: { q?: string } }>, reply) => {
      const query = req.query.q ?? '';
      const result = await searchService.search(req.params.noteId, query);
      reply.send(result);
    },
  );
}
