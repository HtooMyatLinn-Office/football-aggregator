import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  REDIS_CACHE_TTL_TEAMS: z.coerce.number().default(3600),
  REDIS_CACHE_TTL_FIXTURES: z.coerce.number().default(300),
  REDIS_CACHE_TTL_STANDINGS: z.coerce.number().default(600),
  FOOTBALL_DATA_API_KEY: z
    .string()
    .min(1)
    .transform((key) => key.replace(/^Bearer\s+/i, '').trim()),
  FOOTBALL_DATA_BASE_URL: z.string().url().default('https://footballdata.io/api/v1'),
  FOOTBALL_DATA_TIMEOUT_MS: z.coerce.number().default(10000),
  FOOTBALL_DATA_LEAGUE_ID: z.coerce.number().default(10),
  FOOTBALL_DATA_SEASON_ID: z.coerce.number().optional(),
  SPORTMONKS_API_KEY: z.string().min(1),
  SPORTMONKS_BASE_URL: z.string().url().default('https://api.sportmonks.com/v3/football'),
  SPORTMONKS_TIMEOUT_MS: z.coerce.number().default(10000),
  PROVIDER_PRIORITY: z.string().default('footballData,sportmonks'),
  DEFAULT_COMPETITION_CODE: z.string().default('PL'),
  DEFAULT_LEAGUE_ID: z.coerce.number().default(8),
  SYNC_CRON_STANDINGS: z.string().default('0 */6 * * *'),
  SYNC_CRON_FIXTURES: z.string().default('*/15 * * * *'),
  SYNC_CRON_TEAMS: z.string().default('0 2 * * *'),
  SYNC_CRON_IMAGES: z.string().default('0 3 * * *'),
  IMAGE_SYNC_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  IMAGE_LOCAL_CACHE_PATH: z.string().default('./storage/images'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}

export const env = parseEnv();

export function getProviderPriority(): Array<'footballData' | 'sportmonks'> {
  return env.PROVIDER_PRIORITY.split(',').map((p) => {
    const trimmed = p.trim();
    if (trimmed !== 'footballData' && trimmed !== 'sportmonks') {
      throw new Error(`Invalid provider in PROVIDER_PRIORITY: ${trimmed}`);
    }
    return trimmed;
  });
}
