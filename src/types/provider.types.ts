import type { UnifiedTeam } from './unified-team.js';
import type { UnifiedFixture } from './unified-fixture.js';
import type { UnifiedStanding } from './unified-standing.js';

export type ProviderKey = 'footballData' | 'sportmonks';

export interface ProviderQueryOptions {
  /** @deprecated footballdata.io uses leagueId — kept for backward compatibility */
  competitionCode?: string;
  leagueId?: number;
  seasonId?: number;
  season?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FootballProvider {
  readonly name: ProviderKey;
  getTeams(options?: ProviderQueryOptions): Promise<UnifiedTeam[]>;
  getFixtures(options?: ProviderQueryOptions): Promise<UnifiedFixture[]>;
  getStandings(options?: ProviderQueryOptions): Promise<UnifiedStanding[]>;
}

export interface ProviderCapabilities {
  teams: boolean;
  fixtures: boolean;
  standings: boolean;
  teamLogos: boolean;
  playerImages: boolean;
  leagueLogos: boolean;
  stadiumImages: boolean;
  liveScores: boolean;
  historicalData: boolean;
}

export interface ProviderFailureDetail {
  provider: ProviderKey;
  message: string;
  statusCode?: number;
}

export class ProviderError extends Error {
  failures?: ProviderFailureDetail[];

  constructor(
    message: string,
    public readonly provider: ProviderKey,
    public readonly statusCode?: number,
    public readonly isRateLimited = false,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
