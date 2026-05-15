import type { Request, Response, NextFunction } from 'express';
import type { ProvidersService } from './providers.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  health = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.service.getHealth();
      const capabilities = this.service.getCapabilities();
      sendSuccess(res, { health, capabilities }, { total: health.length });
    } catch (err: unknown) {
      next(err);
    }
  };
}
