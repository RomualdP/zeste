import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  });
};

export const errorHandler = fp(errorHandlerPlugin, { name: 'error-handler' });
