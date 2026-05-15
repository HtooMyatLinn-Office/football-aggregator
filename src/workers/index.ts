import { createSyncWorker } from './sync.worker.js';
import { createImageWorker } from './image.worker.js';
import { scheduleRecurringJobs } from '../queues/index.js';
import { logger } from '../utils/logger.js';
import { disconnectPrisma } from '../db/prisma.js';
import { disconnectRedis } from '../config/redis.js';

async function main(): Promise<void> {
  const syncWorker = createSyncWorker();
  const imageWorker = createImageWorker();

  await scheduleRecurringJobs();

  syncWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Sync job completed');
  });

  syncWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err }, 'Sync job failed');
  });

  imageWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Image job completed');
  });

  logger.info('Background workers started');
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Worker bootstrap failed');
  process.exit(1);
});

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Workers shutting down');
  await disconnectPrisma();
  await disconnectRedis();
  process.exit(0);
}
