import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthServicePort } from '../../modules/identity/application/ports/auth-service.port';

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthServicePort;
  }

  interface FastifyRequest {
    user?: { id: string; email: string };
    accessToken?: string;
  }
}

export function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = extractToken(request);
  if (!token) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } });
    return;
  }

  try {
    const user = await request.server.authService.verifyToken(token);
    request.user = user;
    request.accessToken = token;
  } catch {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}
