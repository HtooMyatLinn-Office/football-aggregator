import type { Request, Response, NextFunction } from 'express';
import { ProviderError } from '../types/provider.types.js';
import { sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ProviderError) {
    const status = err.statusCode === 429 ? 429 : 503;
    sendError(res, err.message, status, 'PROVIDER_UNAVAILABLE', {
      provider: err.provider,
      rateLimited: err.isRateLimited,
      failures: err.failures,
    });
    return;
  }

  if (err instanceof Error && err.name === 'ZodError') {
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR');
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
}
