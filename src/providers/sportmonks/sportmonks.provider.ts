import axios from 'axios';
import { env } from '../../config/env.js';
import type {
  FootballProvider,
  ProviderCapabilities,
  ProviderQueryOptions,
} from '../../types/provider.types.js';
import { ProviderError } from '../../types/provider.types.js';
import type { UnifiedTeam } from '../../types/unified-team.js';
import type { UnifiedFixture } from '../../types/unified-fixture.js';
import type { UnifiedStanding } from '../../types/unified-standing.js';
import { createHttpClient } from '../../utils/http-client.js';
import { normalizeSportMonksTeam } from '../../normalizers/team.normalizer.js';
import { normalizeSportMonksFixture } from '../../normalizers/fixture.normalizer.js';
import { normalizeSportMonksStandings } from '../../normalizers/standing.normalizer.js';
import type {
  SportMonksPaginatedResponse,
  SportMonksTeam,
  SportMonksFixture,
  SportMonksStandingsResponse,
} from './sportmonks.types.js';

export const SPORTMONKS_CAPABILITIES: ProviderCapabilities = {
  teams: true,
  fixtures: true,
  standings: true,
  teamLogos: true,
  playerImages: true,
  leagueLogos: true,
  stadiumImages: true,
  liveScores: true,
  historicalData: true,
};

export class SportMonksProvider implements FootballProvider {
  readonly name = 'sportmonks' as const;
  private readonly client = createHttpClient({
    baseURL: env.SPORTMONKS_BASE_URL,
    timeout: env.SPORTMONKS_TIMEOUT_MS,
    providerName: 'sportmonks',
  });

  async getTeams(options?: ProviderQueryOptions): Promise<UnifiedTeam[]> {
    const leagueId = options?.leagueId ?? env.DEFAULT_LEAGUE_ID;
    const data = await this.request<SportMonksPaginatedResponse<SportMonksTeam>>(
      `/teams/seasons/${leagueId}`,
      { include: 'venue' },
    );
    return data.data.map(normalizeSportMonksTeam);
  }

  async getFixtures(options?: ProviderQueryOptions): Promise<UnifiedFixture[]> {
    const leagueId = options?.leagueId ?? env.DEFAULT_LEAGUE_ID;
    const data = await this.request<SportMonksPaginatedResponse<SportMonksFixture>>(
      `/fixtures`,
      {
        filters: `fixtureLeagues:${leagueId}`,
        include: 'participants;scores;league;venue',
      },
    );
    return data.data.map(normalizeSportMonksFixture);
  }

  async getStandings(options?: ProviderQueryOptions): Promise<UnifiedStanding[]> {
    const leagueId = options?.leagueId ?? env.DEFAULT_LEAGUE_ID;
    const data = await this.request<SportMonksStandingsResponse>(
      `/standings/seasons/${leagueId}`,
      { include: 'participant;details' },
    );
    return normalizeSportMonksStandings(data.data, {
      id: leagueId,
      name: 'League',
      season: options?.season,
    });
  }

  private async request<T>(
    path: string,
    extra?: { include?: string; filters?: string },
  ): Promise<T> {
    try {
      const response = await this.client.get<T>(path, {
        params: {
          api_token: env.SPORTMONKS_API_KEY,
          ...extra,
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        throw new ProviderError(
          error.message,
          this.name,
          status,
          status === 429,
        );
      }
      throw new ProviderError(
        error instanceof Error ? error.message : 'Unknown provider error',
        this.name,
      );
    }
  }
}
