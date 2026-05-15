import type { FootballProvider, ProviderKey, ProviderQueryOptions } from '../types/provider.types.js';
import { ProviderError } from '../types/provider.types.js';
import { getProviderPriority } from '../config/env.js';
import type { CacheEntity } from './cache.service.js';
import { CacheService } from './cache.service.js';
import { ProviderHealthService } from './provider-health.service.js';
import { logger } from '../utils/logger.js';

type FetchFn<T> = (provider: FootballProvider, options?: ProviderQueryOptions) => Promise<T[]>;

export interface FallbackResult<T> {
  data: T[];
  source: 'provider' | 'cache';
  providersUsed: ProviderKey[];
  cached: boolean;
}

export class FallbackService {
  constructor(
    private readonly providers: Map<ProviderKey, FootballProvider>,
    private readonly cache: CacheService,
    private readonly health: ProviderHealthService,
  ) {}

  async fetchWithFallback<T>(
    entity: CacheEntity,
    fetchFn: FetchFn<T>,
    options?: ProviderQueryOptions,
    cacheSuffix = 'all',
  ): Promise<FallbackResult<T>> {
    const priority = getProviderPriority();
    const providersUsed: ProviderKey[] = [];
    const failures: Array<{ provider: ProviderKey; message: string; statusCode?: number }> = [];

    for (const key of priority) {
      const provider = this.providers.get(key);
      if (!provider) continue;

      const start = Date.now();
      try {
        const data = await fetchFn(provider, options);
        const duration = Date.now() - start;
        await this.health.recordSuccess(key, duration);
        providersUsed.push(key);

        if (data.length > 0) {
          await this.cache.set(entity, data, cacheSuffix);
          return { data, source: 'provider', providersUsed, cached: false };
        }

        failures.push({ provider: key, message: 'Provider returned empty data' });
      } catch (error: unknown) {
        const duration = Date.now() - start;
        if (error instanceof ProviderError) {
          await this.health.recordFailure(error, duration);
          failures.push({
            provider: key,
            message: error.message,
            statusCode: error.statusCode,
          });
        } else {
          failures.push({
            provider: key,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        logger.warn(
          { provider: key, entity, err: error instanceof Error ? error.message : error },
          'Provider fetch failed, trying next',
        );
      }
    }

    const cached = await this.cache.get<T[]>(entity, cacheSuffix);
    if (cached && cached.length > 0) {
      logger.info({ entity }, 'Serving stale cache after provider failures');
      return { data: cached, source: 'cache', providersUsed, cached: true };
    }

    const summary = failures
      .map((f) => `${f.provider}: ${f.message}${f.statusCode ? ` (${f.statusCode})` : ''}`)
      .join('; ');

    const err = new ProviderError(
      failures.length > 0
        ? `All providers failed — ${summary}`
        : 'All providers unavailable and no cache available',
      priority[0],
    );
    err.failures = failures;
    throw err;
  }
}
