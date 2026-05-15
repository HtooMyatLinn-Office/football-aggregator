import type Redis from 'ioredis';
import { getRedisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export type CacheEntity = 'teams' | 'fixtures' | 'standings';

const TTL_MAP: Record<CacheEntity, number> = {
  teams: env.REDIS_CACHE_TTL_TEAMS,
  fixtures: env.REDIS_CACHE_TTL_FIXTURES,
  standings: env.REDIS_CACHE_TTL_STANDINGS,
};

export class CacheService {
  constructor(private readonly redis: Redis = getRedisClient()) {}

  private buildKey(entity: CacheEntity, suffix = 'all'): string {
    return `football:${entity}:${suffix}`;
  }

  async get<T>(entity: CacheEntity, suffix = 'all'): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.buildKey(entity, suffix));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      logger.warn({ err, entity }, 'Cache read failed');
      return null;
    }
  }

  async set<T>(entity: CacheEntity, data: T, suffix = 'all'): Promise<void> {
    try {
      const key = this.buildKey(entity, suffix);
      const ttl = TTL_MAP[entity];
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (err: unknown) {
      logger.warn({ err, entity }, 'Cache write failed');
    }
  }

  async invalidate(entity: CacheEntity, suffix?: string): Promise<void> {
    try {
      if (suffix) {
        await this.redis.del(this.buildKey(entity, suffix));
        return;
      }
      const pattern = this.buildKey(entity, '*');
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err: unknown) {
      logger.warn({ err, entity }, 'Cache invalidation failed');
    }
  }
}
