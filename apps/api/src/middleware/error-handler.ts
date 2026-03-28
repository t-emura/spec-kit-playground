import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ZodError) {
    reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.format(),
    });
    return;
  }

  if (error.statusCode === 409) {
    reply.status(409).send({
      code: 'VERSION_CONFLICT',
      message: error.message,
    });
    return;
  }

  if (error.statusCode === 404) {
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: error.message,
    });
    return;
  }

  if (error.statusCode && error.statusCode < 500) {
    reply.status(error.statusCode).send({
      code: 'CLIENT_ERROR',
      message: error.message,
    });
    return;
  }

  // Redact sensitive fields from error messages in production
  const message =
    process.env['NODE_ENV'] === 'production' ? 'Internal server error' : error.message;

  reply.status(500).send({
    code: 'INTERNAL_ERROR',
    message,
  });
}
