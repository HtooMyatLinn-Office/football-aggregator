import { Router } from 'express';
import { getContainer } from '../container.js';
import { TeamsController } from '../modules/teams/teams.controller.js';
import { FixturesController } from '../modules/fixtures/fixtures.controller.js';
import { StandingsController } from '../modules/standings/standings.controller.js';
import { ProvidersController } from '../modules/providers/providers.controller.js';
import { validateQuery } from '../middlewares/validate.js';
import { teamsQuerySchema } from '../modules/teams/teams.validation.js';
import { fixturesQuerySchema } from '../modules/fixtures/fixtures.validation.js';
import { standingsQuerySchema } from '../modules/standings/standings.validation.js';

export function createApiRouter(): Router {
  const router = Router();
  const c = getContainer();

  const teams = new TeamsController(c.teamsService);
  const fixtures = new FixturesController(c.fixturesService);
  const standings = new StandingsController(c.standingsService);
  const providers = new ProvidersController(c.providersService);

  router.get('/teams', validateQuery(teamsQuerySchema), teams.list);
  router.get('/teams/:id', teams.getById);
  router.get('/fixtures', validateQuery(fixturesQuerySchema), fixtures.list);
  router.get('/standings', validateQuery(standingsQuerySchema), standings.list);
  router.get('/providers/health', providers.health);

  return router;
}
