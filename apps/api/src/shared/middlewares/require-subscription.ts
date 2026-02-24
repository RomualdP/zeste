import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireSubscription(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  const user = await request.server.userRepository.findById(request.user.id);
  if (!user || !user.subscriptionActive) {
    reply.status(403).send({ error: { code: 'SUBSCRIPTION_REQUIRED', message: 'Active subscription required' } });
    return;
  }
}
