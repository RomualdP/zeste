import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthServicePort } from '../../modules/identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../modules/identity/application/ports/user-repository.port';
import { UserEntity } from '@zeste/domain';

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthServicePort;
    userRepository: UserRepositoryPort;
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

    // Ensure the user exists in public.users (safety net for users who
    // signed up directly via Supabase Auth without going through the backend)
    const existing = await request.server.userRepository.findById(user.id);
    if (!existing) {
      const displayName = user.email.split('@')[0] ?? 'User';
      const newUser = UserEntity.create(user.id, user.email, displayName);
      await request.server.userRepository.save(newUser);
    }
  } catch {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}
