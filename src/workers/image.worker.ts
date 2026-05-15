import { Worker, type Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { IMAGE_QUEUE_NAME, type ImageJobName, type ImageJobPayload } from '../queues/index.js';
import { ImageSyncService } from '../services/image-sync.service.js';
import { logger } from '../utils/logger.js';

async function handleImageJob(job: Job<ImageJobPayload, void, ImageJobName>): Promise<void> {
  const imageSync = new ImageSyncService();

  switch (job.name) {
    case 'sync-team-images':
      await imageSync.syncTeamLogos(job.data.limit ?? 50);
      break;
    case 'sync-league-images':
      logger.info('League image sync scheduled for future implementation');
      break;
    default:
      logger.warn({ jobName: job.name }, 'Unknown image job');
  }
}

export function createImageWorker(): Worker<ImageJobPayload, void, ImageJobName> {
  return new Worker<ImageJobPayload, void, ImageJobName>(IMAGE_QUEUE_NAME, handleImageJob, {
    connection: getRedisClient(),
    concurrency: 1,
  });
}
