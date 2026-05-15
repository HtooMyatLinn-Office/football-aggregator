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
import { normalizeFootballDataTeam } from '../../normalizers/team.normalizer.js';
import { normalizeFootballDataFixture } from '../../normalizers/fixture.normalizer.js';
import { normalizeFootballDataStandings } from '../../normalizers/standing.normalizer.js';
import type {
  FootballdataApiResponse,
  FootballdataMatchesPayload,
  FootballdataStandingsPayload,
  FootballdataTeamsPayload,
} from './football-data.types.js';

export const FOOTBALL_DATA_CAPABILITIES: ProviderCapabilities = {
  teams: true,
  fixtures: true,
  standings: true,
  teamLogos: true,
  playerImages: false,
  leagueLogos: true,
  stadiumImages: false,
  liveScores: false,
  historicalData: true,
};

export class FootballDataProvider implements FootballProvider {
  readonly name = 'footballData' as const;
  private readonly client = createHttpClient({
    baseURL: env.FOOTBALL_DATA_BASE_URL,
    timeout: env.FOOTBALL_DATA_TIMEOUT_MS,
    apiKey: env.FOOTBALL_DATA_API_KEY,
    authMode: 'bearer',
    providerName: 'footballData',
  });

  async getTeams(options?: ProviderQueryOptions): Promise<UnifiedTeam[]> {
    const leagueId = options?.leagueId ?? env.FOOTBALL_DATA_LEAGUE_ID;
    const params = this.buildSeasonParams(options);
    const payload = await this.request<FootballdataTeamsPayload>(
      `/leagues/${leagueId}/teams`,
      params,
    );
    return payload.teams.map(normalizeFootballDataTeam);
  }

  async getFixtures(options?: ProviderQueryOptions): Promise<UnifiedFixture[]> {
    const leagueId = options?.leagueId ?? env.FOOTBALL_DATA_LEAGUE_ID;
    const params: Record<string, string> = { ...this.buildSeasonParams(options), limit: '100' };
    if (options?.dateFrom) params.from = options.dateFrom;
    if (options?.dateTo) params.to = options.dateTo;

    const payload = await this.request<FootballdataMatchesPayload>(
      `/leagues/${leagueId}/matches`,
      params,
    );
    return payload.matches.map((m) =>
      normalizeFootballDataFixture(m, payload.league ?? { league_id: leagueId, name: 'League' }),
    );
  }

  async getStandings(options?: ProviderQueryOptions): Promise<UnifiedStanding[]> {
    const leagueId = options?.leagueId ?? env.FOOTBALL_DATA_LEAGUE_ID;
    const params = this.buildSeasonParams(options);
    const payload = await this.request<FootballdataStandingsPayload>(
      `/leagues/${leagueId}/standings`,
      params,
    );
    return normalizeFootballDataStandings(payload);
  }

  private buildSeasonParams(options?: ProviderQueryOptions): Record<string, string> {
    const seasonId = options?.seasonId ?? env.FOOTBALL_DATA_SEASON_ID;
    if (seasonId === undefined) return {};
    return { season_id: String(seasonId) };
  }

  private async request<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    try {
      const response = await this.client.get<FootballdataApiResponse<T>>(path, { params });

      if (!response.data.success) {
        throw new ProviderError('Provider returned success=false', this.name, 400);
      }

      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof ProviderError) throw error;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const apiError = error.response?.data as { error?: { message?: string } } | undefined;
        const message = apiError?.error?.message ?? error.message;
        throw new ProviderError(message, this.name, status, status === 429);
      }

      throw new ProviderError(
        error instanceof Error ? error.message : 'Unknown provider error',
        this.name,
      );
    }
  }
}
