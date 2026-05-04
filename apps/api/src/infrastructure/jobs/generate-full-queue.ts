import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import type { GenerateFullJobPayload, GenerateFullWorker } from './generate-full-worker';

export const GENERATE_FULL_QUEUE = 'generate-full';

export function buildRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  return { url } as unknown as ConnectionOptions;
}

export function createGenerateFullQueue(connection: ConnectionOptions = buildRedisConnection()): Queue<GenerateFullJobPayload> {
  return new Queue<GenerateFullJobPayload>(GENERATE_FULL_QUEUE, { connection });
}

export function startGenerateFullWorker(
  worker: GenerateFullWorker,
  connection: ConnectionOptions = buildRedisConnection(),
): Worker<GenerateFullJobPayload> {
  return new Worker<GenerateFullJobPayload>(
    GENERATE_FULL_QUEUE,
    async (job) => {
      await worker.run(job.data);
    },
    { connection },
  );
}
