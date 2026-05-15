import { Worker, type Job } from 'bullmq';
import { SyncStatus } from '@prisma/client';
import { getRedisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { getContainer } from '../container.js';
import { SYNC_QUEUE_NAME, type SyncJobName, type SyncJobPayload } from '../queues/index.js';
import { logger } from '../utils/logger.js';
import type { ProviderKey } from '../types/provider.types.js';

async function handleSyncJob(job: Job<SyncJobPayload, void, SyncJobName>): Promise<void> {
  const container = getContainer();
  const options = {
    competitionCode: job.data.competitionCode ?? env.DEFAULT_COMPETITION_CODE,
    leagueId: job.data.leagueId ?? env.DEFAULT_LEAGUE_ID,
  };
  const start = Date.now();
  const provider: ProviderKey = 'footballData';

  try {
    switch (job.name) {
      case 'sync-teams': {
        const result = await container.teamsService.list(options);
        await container.persistenceService.logSync(
          provider,
          'teams',
          SyncStatus.success,
          result.data.length,
          Date.now() - start,
        );
        break;
      }
      case 'sync-fixtures': {
        const result = await container.fixturesService.list(options);
        await container.persistenceService.logSync(
          provider,
          'fixtures',
          SyncStatus.success,
          result.data.length,
          Date.now() - start,
        );
        break;
      }
      case 'sync-standings': {
        const result = await container.standingsService.list(options);
        await container.persistenceService.logSync(
          provider,
          'standings',
          SyncStatus.success,
          result.data.length,
          Date.now() - start,
        );
        break;
      }
      default:
        logger.warn({ jobName: job.name }, 'Unknown sync job');
    }
  } catch (err: unknown) {
    await container.persistenceService.logSync(
      provider,
      job.name.replace('sync-', ''),
      SyncStatus.failed,
      0,
      Date.now() - start,
      err instanceof Error ? err.message : 'Unknown error',
    );
    throw err;
  }
}

export function createSyncWorker(): Worker<SyncJobPayload, void, SyncJobName> {
  return new Worker<SyncJobPayload, void, SyncJobName>(SYNC_QUEUE_NAME, handleSyncJob, {
    connection: getRedisClient(),
    concurrency: 2,
  });
}
