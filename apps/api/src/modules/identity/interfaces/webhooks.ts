import type { FastifyPluginAsync } from 'fastify';
import { HandleSubscriptionWebhook } from '../application/use-cases/handle-subscription-webhook';

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/webhooks/revenuecat — called by RevenueCat
  app.post('/revenuecat', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' },
      });
    }

    try {
      const useCase = new HandleSubscriptionWebhook(app.userRepository);
      await useCase.execute(request.body as any);
      return reply.status(200).send({ data: { ok: true } });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'WEBHOOK_ERROR', message: err.message },
      });
    }
  });
};
