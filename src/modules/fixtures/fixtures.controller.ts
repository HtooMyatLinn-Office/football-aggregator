import type { Request, Response, NextFunction } from 'express';
import type { FixturesService } from './fixtures.service.js';
import type { FixturesQuery } from './fixtures.validation.js';
import { sendSuccess } from '../../utils/api-response.js';

export class FixturesController {
  constructor(private readonly service: FixturesService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as FixturesQuery;
      const result = await this.service.list(query);
      sendSuccess(res, result.data, {
        source: result.source,
        cached: result.cached,
        providers: result.providersUsed,
        total: result.data.length,
      });
    } catch (err: unknown) {
      next(err);
    }
  };
}
