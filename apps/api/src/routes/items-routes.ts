import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client.js';
import { NoteRepository } from '../repositories/note-repository.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { ItemService } from '../services/item-service.js';

export async function itemsRoutes(server: FastifyInstance) {
  const noteRepo = new NoteRepository(db);
  const itemRepo = new ItemRepository(db);
  const itemService = new ItemService(itemRepo, noteRepo);

  // PATCH /v1/items/:itemId
  server.patch('/items/:itemId', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    const item = await itemService.updateItem(req.params.itemId, req.body);
    reply.send(item);
  });

  // DELETE /v1/items/:itemId
  server.delete('/items/:itemId', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    await itemService.deleteItem(req.params.itemId);
    reply.status(204).send();
  });

  // POST /v1/items/:itemId/move
  server.post('/items/:itemId/move', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    const item = await itemService.moveItem(req.params.itemId, req.body);
    reply.send(item);
  });

  // POST /v1/items/:itemId/indent
  server.post('/items/:itemId/indent', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    const item = await itemService.indentItem(req.params.itemId);
    reply.send(item);
  });

  // POST /v1/items/:itemId/outdent
  server.post('/items/:itemId/outdent', async (req: FastifyRequest<{ Params: { itemId: string } }>, reply) => {
    const item = await itemService.outdentItem(req.params.itemId);
    reply.send(item);
  });
}
