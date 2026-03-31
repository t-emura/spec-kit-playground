import type { FastifyInstance, FastifyRequest } from 'fastify';
import { env } from '../config/env.js';
import { NoteRepository } from '../repositories/note-repository.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { MetadataRepository } from '../repositories/metadata-repository.js';
import { MetadataService } from '../services/metadata-service.js';

export async function metadataExportRoutes(server: FastifyInstance) {
  const noteRepo = new NoteRepository(env.NOTES_DIR);
  const itemRepo = new ItemRepository(env.NOTES_DIR, noteRepo);
  const metaRepo = new MetadataRepository(env.NOTES_DIR, noteRepo);
  const metadataService = new MetadataService(metaRepo, itemRepo);

  // GET /v1/items/:itemId/metadata
  server.get('/items/:itemId/metadata', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    const meta = await metadataService.getMetadata(req.params.itemId);
    if (!meta) {
      reply.status(404).send({ code: 'NOT_FOUND', message: 'Metadata not found' });
      return;
    }
    reply.send(meta);
  });

  // PUT /v1/items/:itemId/metadata
  server.put('/items/:itemId/metadata', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    const meta = await metadataService.upsertMetadata(req.params.itemId, req.body);
    reply.send(meta);
  });
}
