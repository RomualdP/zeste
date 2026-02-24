import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { RegisterUser } from '../../../application/use-cases/register-user';
import { LoginUser } from '../../../application/use-cases/login-user';
import { LogoutUser } from '../../../application/use-cases/logout-user';
import { DeleteAccount } from '../../../application/use-cases/delete-account';
import type { AuthServicePort } from '../../../application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../../application/ports/user-repository.port';

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthServicePort;
    userRepository: UserRepositoryPort;
  }
}

function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = extractToken(request);
  if (!token) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } });
    return;
  }

  try {
    const user = await (request.server as any).authService.verifyToken(token);
    (request as any).user = user;
    (request as any).accessToken = token;
  } catch {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /register — public
  app.post('/register', async (request, reply) => {
    const { email, password, displayName } = request.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!email || !password || !displayName) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'email, password and displayName are required' },
      });
    }

    try {
      const useCase = new RegisterUser(app.authService, app.userRepository);
      const result = await useCase.execute({ email, password, displayName });
      return reply.status(201).send({ data: result });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });

  // POST /login — public
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      });
    }

    try {
      const useCase = new LoginUser(app.authService);
      const result = await useCase.execute({ email, password });
      return reply.status(200).send({ data: result });
    } catch (err: any) {
      const isValidationError = err.message?.includes('Invalid email');
      const statusCode = isValidationError ? 400 : 401;
      const code = isValidationError ? 'VALIDATION_ERROR' : 'AUTH_ERROR';
      return reply.status(statusCode).send({
        error: { code, message: err.message },
      });
    }
  });

  // POST /logout — authenticated
  app.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    const token = (request as any).accessToken as string;
    const useCase = new LogoutUser(app.authService);
    await useCase.execute({ accessToken: token });
    return reply.status(200).send({ data: { message: 'Logged out' } });
  });

  // DELETE /account — authenticated
  app.delete('/account', { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user as { id: string };
    const useCase = new DeleteAccount(app.authService, app.userRepository);
    await useCase.execute({ userId: user.id });
    return reply.status(204).send();
  });
};
