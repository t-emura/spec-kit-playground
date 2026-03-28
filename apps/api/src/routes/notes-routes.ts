import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/client.js';
import { NoteRepository } from '../repositories/note-repository.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { NoteService } from '../services/note-service.js';
import { ItemService } from '../services/item-service.js';

export async function notesRoutes(server: FastifyInstance) {
  const noteRepo = new NoteRepository(db);
  const itemRepo = new ItemRepository(db);
  const noteService = new NoteService(noteRepo);
  const itemService = new ItemService(itemRepo, noteRepo);

  // GET /v1/notes
  server.get('/notes', async (_req, reply) => {
    const notes = await noteService.listNotes();
    reply.send({ items: notes });
  });

  // POST /v1/notes
  server.post('/notes', async (req: FastifyRequest, reply: FastifyReply) => {
    const note = await noteService.createNote(req.body);
    reply.status(201).send(note);
  });

  // PATCH /v1/notes/:noteId
  server.patch('/notes/:noteId', async (req: FastifyRequest<{ Params: { noteId: string } }>, reply) => {
    const note = await noteService.updateNote(req.params.noteId, req.body);
    reply.send(note);
  });

  // DELETE /v1/notes/:noteId
  server.delete('/notes/:noteId', async (req: FastifyRequest<{ Params: { noteId: string } }>, reply) => {
    await noteService.deleteNote(req.params.noteId);
    reply.status(204).send();
  });

  // GET /v1/notes/:noteId/items
  server.get('/notes/:noteId/items', async (req: FastifyRequest<{ Params: { noteId: string } }>, reply) => {
    const items = await itemService.getItemTree(req.params.noteId);
    reply.send({ items });
  });

  // POST /v1/notes/:noteId/items
  server.post('/notes/:noteId/items', async (req: FastifyRequest<{ Params: { noteId: string } }>, reply) => {
    const item = await itemService.createItem(req.params.noteId, req.body);
    reply.status(201).send(item);
  });
}
