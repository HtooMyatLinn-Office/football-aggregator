import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';
import { sendError } from '../utils/api-response.js';

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendError(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', {
        issues: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.validatedQuery = result.data;
    next();
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    validatedQuery?: unknown;
  }
}
