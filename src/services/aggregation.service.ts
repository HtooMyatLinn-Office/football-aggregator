import type {
  FootballProvider,
  ProviderKey,
  ProviderQueryOptions,
} from '../types/provider.types.js';
import type { UnifiedTeam } from '../types/unified-team.js';
import type { UnifiedFixture } from '../types/unified-fixture.js';
import type { UnifiedStanding } from '../types/unified-standing.js';
import { mergeTeams, mergeFixtures, mergeStandings, dedupeById } from '../utils/merge.js';
import { createProviders } from '../providers/index.js';
import { getProviderPriority } from '../config/env.js';
import { ProviderError } from '../types/provider.types.js';
import { ProviderHealthService } from './provider-health.service.js';
import { logger } from '../utils/logger.js';

function teamMatchKey(a: UnifiedTeam, b: UnifiedTeam): boolean {
  if (a.name.toLowerCase() === b.name.toLowerCase()) return true;
  if (a.shortName && b.shortName && a.shortName.toLowerCase() === b.shortName.toLowerCase()) {
    return true;
  }
  return false;
}

function findMatchingTeam(teams: UnifiedTeam[], candidate: UnifiedTeam): UnifiedTeam | undefined {
  return teams.find((t) => teamMatchKey(t, candidate));
}

export class AggregationService {
  constructor(
    private readonly providers = createProviders(),
    private readonly health = new ProviderHealthService(),
  ) {}

  async aggregateTeams(options?: ProviderQueryOptions): Promise<UnifiedTeam[]> {
    const results = await this.fetchFromAllProviders('teams', (p) => p.getTeams(options));
    return this.mergeTeamLists(results);
  }

  async aggregateFixtures(options?: ProviderQueryOptions): Promise<UnifiedFixture[]> {
    const results = await this.fetchFromAllProviders('fixtures', (p) => p.getFixtures(options));
    return this.mergeFixtureLists(results);
  }

  async aggregateStandings(options?: ProviderQueryOptions): Promise<UnifiedStanding[]> {
    const results = await this.fetchFromAllProviders('standings', (p) =>
      p.getStandings(options),
    );
    return this.mergeStandingLists(results);
  }

  private async fetchFromAllProviders<T>(
    label: string,
    fetchFn: (provider: FootballProvider) => Promise<T[]>,
  ): Promise<Map<ProviderKey, T[]>> {
    const priority = getProviderPriority();
    const results = new Map<ProviderKey, T[]>();

    await Promise.all(
      priority.map(async (key) => {
        const provider = this.providers.get(key);
        if (!provider) return;
        const start = Date.now();
        try {
          const data = await fetchFn(provider);
          results.set(key, data);
          await this.health.recordSuccess(key, Date.now() - start);
        } catch (error: unknown) {
          if (error instanceof ProviderError) {
            await this.health.recordFailure(error, Date.now() - start);
          }
          logger.warn({ provider: key, label }, 'Aggregation provider fetch failed');
        }
      }),
    );

    return results;
  }

  private mergeTeamLists(byProvider: Map<ProviderKey, UnifiedTeam[]>): UnifiedTeam[] {
    const priority = getProviderPriority();
    const primaryKey = priority[0];
    const primary = byProvider.get(primaryKey) ?? [];
    const merged = [...primary];

    for (const key of priority.slice(1)) {
      const secondary = byProvider.get(key) ?? [];
      for (const team of secondary) {
        const match = findMatchingTeam(merged, team);
        if (match) {
          const idx = merged.indexOf(match);
          merged[idx] = mergeTeams(match, team);
        } else {
          merged.push(team);
        }
      }
    }

    return dedupeById(merged);
  }

  private mergeFixtureLists(byProvider: Map<ProviderKey, UnifiedFixture[]>): UnifiedFixture[] {
    const priority = getProviderPriority();
    const primaryKey = priority[0];
    const primary = byProvider.get(primaryKey) ?? [];
    const merged = [...primary];

    for (const key of priority.slice(1)) {
      const secondary = byProvider.get(key) ?? [];
      for (const fixture of secondary) {
        const match = merged.find(
          (f) =>
            f.utcDate === fixture.utcDate &&
            teamMatchKey(f.homeTeam, fixture.homeTeam) &&
            teamMatchKey(f.awayTeam, fixture.awayTeam),
        );
        if (match) {
          const idx = merged.indexOf(match);
          merged[idx] = mergeFixtures(match, fixture);
        } else {
          merged.push(fixture);
        }
      }
    }

    return dedupeById(merged);
  }

  private mergeStandingLists(
    byProvider: Map<ProviderKey, UnifiedStanding[]>,
  ): UnifiedStanding[] {
    const priority = getProviderPriority();
    const primaryKey = priority[0];
    const primary = byProvider.get(primaryKey) ?? [];
    const merged = [...primary];

    for (const key of priority.slice(1)) {
      const secondary = byProvider.get(key) ?? [];
      for (const standing of secondary) {
        const match = merged.find(
          (s) =>
            s.position === standing.position &&
            teamMatchKey(s.team, standing.team),
        );
        if (match) {
          const idx = merged.indexOf(match);
          merged[idx] = mergeStandings(match, standing);
        } else {
          merged.push(standing);
        }
      }
    }

    return dedupeById(merged);
  }
}
