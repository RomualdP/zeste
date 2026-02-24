import { describe, it, expect } from 'vitest';
import { createApp } from './create-app';

describe('createApp', () => {
  it('should create a Fastify instance', async () => {
    const app = createApp();
    expect(app).toBeDefined();
    await app.close();
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const app = createApp();
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
      await app.close();
    });
  });

  describe('error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const app = createApp();
      const response = await app.inject({
        method: 'GET',
        url: '/unknown',
      });
      expect(response.statusCode).toBe(404);
      await app.close();
    });
  });
});
