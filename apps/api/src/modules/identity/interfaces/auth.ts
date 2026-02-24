import type { FastifyPluginAsync } from 'fastify';
import { RegisterUser } from '../application/use-cases/register-user';
import { LoginUser } from '../application/use-cases/login-user';
import { LogoutUser } from '../application/use-cases/logout-user';
import { DeleteAccount } from '../application/use-cases/delete-account';
import type { UserRepositoryPort } from '../application/ports/user-repository.port';
import { requireAuth } from '../../../shared/middlewares/require-auth';

declare module 'fastify' {
  interface FastifyInstance {
    userRepository: UserRepositoryPort;
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
    const useCase = new LogoutUser(app.authService);
    await useCase.execute({ accessToken: request.accessToken! });
    return reply.status(200).send({ data: { message: 'Logged out' } });
  });

  // DELETE /account — authenticated
  app.delete('/account', { preHandler: requireAuth }, async (request, reply) => {
    const useCase = new DeleteAccount(app.authService, app.userRepository);
    await useCase.execute({ userId: request.user!.id });
    return reply.status(204).send();
  });
};
