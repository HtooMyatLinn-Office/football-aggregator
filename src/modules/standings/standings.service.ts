import type { FallbackService, FallbackResult } from '../../services/fallback.service.js';
import type { AggregationService } from '../../services/aggregation.service.js';
import type { PersistenceService } from '../../db/persistence.service.js';
import type { UnifiedStanding } from '../../types/unified-standing.js';
import type { ProviderQueryOptions } from '../../types/provider.types.js';

export class StandingsService {
  constructor(
    private readonly fallback: FallbackService,
    private readonly aggregation: AggregationService,
    private readonly persistence: PersistenceService,
  ) {}

  async list(options?: ProviderQueryOptions): Promise<FallbackResult<UnifiedStanding>> {
    const result = await this.fallback.fetchWithFallback(
      'standings',
      (provider, opts) => provider.getStandings(opts ?? options),
      options,
    );

    try {
      const aggregated = await this.aggregation.aggregateStandings(options);
      if (aggregated.length > 0) {
        await this.persistence.upsertStandings(aggregated);
        return { ...result, data: aggregated };
      }
    } catch {
      // best-effort
    }

    if (result.data.length > 0) {
      try {
        await this.persistence.upsertStandings(result.data);
      } catch {
        // persistence is best-effort; still return provider data
      }
    }

    return result;
  }
}
