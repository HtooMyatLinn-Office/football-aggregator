import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';

const connection = getRedisClient();

export const SYNC_QUEUE_NAME = 'football-sync';
export const IMAGE_QUEUE_NAME = 'football-images';

export type SyncJobName = 'sync-teams' | 'sync-fixtures' | 'sync-standings';
export type ImageJobName = 'sync-team-images' | 'sync-league-images';

export interface SyncJobPayload {
  competitionCode?: string;
  leagueId?: number;
}

export interface ImageJobPayload {
  entityType: 'team' | 'league';
  limit?: number;
}

export const syncQueue = new Queue<SyncJobPayload, void, SyncJobName>(SYNC_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

export const imageQueue = new Queue<ImageJobPayload, void, ImageJobName>(IMAGE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
  },
});

export async function scheduleRecurringJobs(): Promise<void> {
  const { env } = await import('../config/env.js');

  await syncQueue.add(
    'sync-standings',
    {},
    { repeat: { pattern: env.SYNC_CRON_STANDINGS } },
  );
  await syncQueue.add(
    'sync-fixtures',
    {},
    { repeat: { pattern: env.SYNC_CRON_FIXTURES } },
  );
  await syncQueue.add(
    'sync-teams',
    {},
    { repeat: { pattern: env.SYNC_CRON_TEAMS } },
  );

  if (env.IMAGE_SYNC_ENABLED) {
    await imageQueue.add(
      'sync-team-images',
      { entityType: 'team' },
      { repeat: { pattern: env.SYNC_CRON_IMAGES } },
    );
  }
}
