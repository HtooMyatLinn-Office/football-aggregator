import type { FootballProvider, ProviderKey } from '../types/provider.types.js';
import { FootballDataProvider, FOOTBALL_DATA_CAPABILITIES } from './football-data/football-data.provider.js';
import { SportMonksProvider, SPORTMONKS_CAPABILITIES } from './sportmonks/sportmonks.provider.js';
import type { ProviderCapabilities } from '../types/provider.types.js';

export function createProviders(): Map<ProviderKey, FootballProvider> {
  const map = new Map<ProviderKey, FootballProvider>();
  map.set('footballData', new FootballDataProvider());
  map.set('sportmonks', new SportMonksProvider());
  return map;
}

export const PROVIDER_CAPABILITIES: Record<ProviderKey, ProviderCapabilities> = {
  footballData: FOOTBALL_DATA_CAPABILITIES,
  sportmonks: SPORTMONKS_CAPABILITIES,
};

export { FootballDataProvider, SportMonksProvider };
