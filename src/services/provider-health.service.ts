import { ProviderName } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import type { ProviderKey } from '../types/provider.types.js';
import { ProviderError } from '../types/provider.types.js';
import { logger } from '../utils/logger.js';

export interface ProviderHealthSnapshot {
  provider: ProviderKey;
  isHealthy: boolean;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureCount: number;
  rateLimitErrors: number;
  avgResponseTimeMs: number | null;
  lastResponseTimeMs: number | null;
}

function toPrismaProvider(key: ProviderKey): ProviderName {
  return key === 'footballData' ? ProviderName.footballData : ProviderName.sportmonks;
}

function fromPrismaProvider(name: ProviderName): ProviderKey {
  return name === ProviderName.footballData ? 'footballData' : 'sportmonks';
}

export class ProviderHealthService {
  async recordSuccess(provider: ProviderKey, responseTimeMs: number): Promise<void> {
    try {
      const prismaProvider = toPrismaProvider(provider);
      const existing = await prisma.providerHealth.findUnique({
        where: { provider: prismaProvider },
      });

      const prevAvg = existing?.avgResponseTimeMs ?? responseTimeMs;
      const avgResponseTimeMs = (prevAvg + responseTimeMs) / 2;

      await prisma.providerHealth.upsert({
        where: { provider: prismaProvider },
        create: {
          provider: prismaProvider,
          isHealthy: true,
          lastSuccessAt: new Date(),
          lastResponseTimeMs: responseTimeMs,
          avgResponseTimeMs: responseTimeMs,
        },
        update: {
          isHealthy: true,
          lastSuccessAt: new Date(),
          lastResponseTimeMs: responseTimeMs,
          avgResponseTimeMs,
        },
      });
    } catch (err: unknown) {
      logger.warn({ err, provider }, 'Could not record provider success (DB unavailable?)');
    }
  }

  async recordFailure(error: ProviderError, responseTimeMs?: number): Promise<void> {
    logger.warn(
      { provider: error.provider, statusCode: error.statusCode, rateLimited: error.isRateLimited },
      'Provider health degraded',
    );

    try {
      const prismaProvider = toPrismaProvider(error.provider);
      const existing = await prisma.providerHealth.findUnique({
        where: { provider: prismaProvider },
      });

      await prisma.providerHealth.upsert({
        where: { provider: prismaProvider },
        create: {
          provider: prismaProvider,
          isHealthy: false,
          lastFailureAt: new Date(),
          failureCount: 1,
          rateLimitErrors: error.isRateLimited ? 1 : 0,
          lastResponseTimeMs: responseTimeMs ?? null,
        },
        update: {
          isHealthy: false,
          lastFailureAt: new Date(),
          failureCount: (existing?.failureCount ?? 0) + 1,
          rateLimitErrors:
            (existing?.rateLimitErrors ?? 0) + (error.isRateLimited ? 1 : 0),
          lastResponseTimeMs: responseTimeMs ?? existing?.lastResponseTimeMs,
        },
      });
    } catch (err: unknown) {
      logger.warn({ err, provider: error.provider }, 'Could not record provider failure (DB unavailable?)');
    }
  }

  async getAll(): Promise<ProviderHealthSnapshot[]> {
    try {
      const rows = await prisma.providerHealth.findMany();
      return rows.map((row) => ({
      provider: fromPrismaProvider(row.provider),
      isHealthy: row.isHealthy,
      lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
      lastFailureAt: row.lastFailureAt?.toISOString() ?? null,
      failureCount: row.failureCount,
      rateLimitErrors: row.rateLimitErrors,
      avgResponseTimeMs: row.avgResponseTimeMs,
      lastResponseTimeMs: row.lastResponseTimeMs,
    }));
    } catch (err: unknown) {
      logger.warn({ err }, 'Could not read provider health from DB');
      return [];
    }
  }
}
