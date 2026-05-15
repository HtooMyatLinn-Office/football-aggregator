import type { Request, Response, NextFunction } from 'express';
import type { TeamsService } from './teams.service.js';
import type { TeamsQuery } from './teams.validation.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.validatedQuery as TeamsQuery;
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

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const team = await this.service.getById(id);
      if (!team) {
        sendError(res, 'Team not found', 404, 'NOT_FOUND');
        return;
      }
      sendSuccess(res, team, { id });
    } catch (err: unknown) {
      next(err);
    }
  };
}
