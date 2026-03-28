import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client.js';
import { NoteRepository } from '../repositories/note-repository.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { MetadataRepository } from '../repositories/metadata-repository.js';
import { ExportSnapshotRepository } from '../repositories/export-snapshot-repository.js';
import { MetadataService } from '../services/metadata-service.js';
import { ExportService } from '../services/export-service.js';

export async function metadataExportRoutes(server: FastifyInstance) {
  const noteRepo = new NoteRepository(db);
  const itemRepo = new ItemRepository(db);
  const metaRepo = new MetadataRepository(db);
  const snapshotRepo = new ExportSnapshotRepository(db);
  const metadataService = new MetadataService(metaRepo, itemRepo);
  const exportService = new ExportService(noteRepo, itemRepo, metaRepo, snapshotRepo);

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

  // POST /v1/notes/:noteId/export
  server.post('/notes/:noteId/export', async (req: FastifyRequest<{ Params: { noteId: string } }>, reply) => {
    const result = await exportService.export(req.params.noteId, req.body as any);
    reply.send(result);
  });
}
