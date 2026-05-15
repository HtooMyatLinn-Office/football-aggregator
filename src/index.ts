import { env } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';
import { disconnectPrisma } from './db/prisma.js';
import { disconnectRedis } from './config/redis.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Football Data Aggregator API started');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  server.close();
  await disconnectPrisma();
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
