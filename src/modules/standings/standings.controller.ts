import type { Request, Response, NextFunction } from 'express';
import type { StandingsService } from './standings.service.js';
import type { StandingsQuery } from './standings.validation.js';
import { sendSuccess } from '../../utils/api-response.js';

export class StandingsController {
  constructor(private readonly service: StandingsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as StandingsQuery;
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
