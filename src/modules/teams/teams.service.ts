import type { FallbackService, FallbackResult } from '../../services/fallback.service.js';
import type { AggregationService } from '../../services/aggregation.service.js';
import type { PersistenceService } from '../../db/persistence.service.js';
import type { UnifiedTeam } from '../../types/unified-team.js';
import type { ProviderQueryOptions } from '../../types/provider.types.js';

export interface TeamsListResult extends FallbackResult<UnifiedTeam> {
  aggregated?: UnifiedTeam[];
}

export class TeamsService {
  constructor(
    private readonly fallback: FallbackService,
    private readonly aggregation: AggregationService,
    private readonly persistence: PersistenceService,
  ) {}

  async list(options?: ProviderQueryOptions): Promise<TeamsListResult> {
    const result = await this.fallback.fetchWithFallback(
      'teams',
      (provider, opts) => provider.getTeams(opts ?? options),
      options,
    );

    let aggregated: UnifiedTeam[] | undefined;
    try {
      aggregated = await this.aggregation.aggregateTeams(options);
      if (aggregated.length > 0) {
        await this.persistence.upsertTeams(aggregated);
        return { ...result, data: aggregated, aggregated };
      }
    } catch {
      // aggregation is best-effort enrichment
    }

    if (result.data.length > 0) {
      await this.persistence.upsertTeams(result.data);
    }

    return result;
  }

  async getById(id: string): Promise<UnifiedTeam | null> {
    const fromDb = await this.persistence.findTeamByUnifiedId(id);
    if (fromDb) return fromDb;

    const list = await this.list();
    return list.data.find((t) => t.id === id) ?? null;
  }
}
