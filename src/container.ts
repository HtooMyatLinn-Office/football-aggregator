import { createProviders } from './providers/index.js';
import { CacheService } from './services/cache.service.js';
import { ProviderHealthService } from './services/provider-health.service.js';
import { FallbackService } from './services/fallback.service.js';
import { AggregationService } from './services/aggregation.service.js';
import { TeamsService } from './modules/teams/teams.service.js';
import { FixturesService } from './modules/fixtures/fixtures.service.js';
import { StandingsService } from './modules/standings/standings.service.js';
import { ProvidersService } from './modules/providers/providers.service.js';
import { PersistenceService } from './db/persistence.service.js';

export interface AppContainer {
  cacheService: CacheService;
  healthService: ProviderHealthService;
  fallbackService: FallbackService;
  aggregationService: AggregationService;
  persistenceService: PersistenceService;
  teamsService: TeamsService;
  fixturesService: FixturesService;
  standingsService: StandingsService;
  providersService: ProvidersService;
}

let container: AppContainer | null = null;

export function createContainer(): AppContainer {
  const providers = createProviders();
  const cacheService = new CacheService();
  const healthService = new ProviderHealthService();
  const fallbackService = new FallbackService(providers, cacheService, healthService);
  const aggregationService = new AggregationService(providers, healthService);
  const persistenceService = new PersistenceService();

  return {
    cacheService,
    healthService,
    fallbackService,
    aggregationService,
    persistenceService,
    teamsService: new TeamsService(fallbackService, aggregationService, persistenceService),
    fixturesService: new FixturesService(fallbackService, aggregationService, persistenceService),
    standingsService: new StandingsService(fallbackService, aggregationService, persistenceService),
    providersService: new ProvidersService(healthService),
  };
}

export function getContainer(): AppContainer {
  if (!container) {
    container = createContainer();
  }
  return container;
}
