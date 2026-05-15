import type { FallbackService, FallbackResult } from '../../services/fallback.service.js';
import type { AggregationService } from '../../services/aggregation.service.js';
import type { PersistenceService } from '../../db/persistence.service.js';
import type { UnifiedFixture } from '../../types/unified-fixture.js';
import type { ProviderQueryOptions } from '../../types/provider.types.js';

export class FixturesService {
  constructor(
    private readonly fallback: FallbackService,
    private readonly aggregation: AggregationService,
    private readonly persistence: PersistenceService,
  ) {}

  async list(options?: ProviderQueryOptions): Promise<FallbackResult<UnifiedFixture>> {
    const result = await this.fallback.fetchWithFallback(
      'fixtures',
      (provider, opts) => provider.getFixtures(opts ?? options),
      options,
    );

    try {
      const aggregated = await this.aggregation.aggregateFixtures(options);
      if (aggregated.length > 0) {
        await this.persistence.upsertFixtures(aggregated);
        return { ...result, data: aggregated };
      }
    } catch {
      // best-effort
    }

    if (result.data.length > 0) {
      await this.persistence.upsertFixtures(result.data);
    }

    return result;
  }
}
