import type { UnifiedTeam } from './unified-team.js';

export interface UnifiedFixture {
  id: string;
  providerIds: {
    footballData?: string;
    sportmonks?: string;
  };
  competition?: {
    id?: string;
    name?: string;
    code?: string;
  };
  season?: string;
  matchday?: number;
  utcDate: string;
  status: string;
  homeTeam: UnifiedTeam;
  awayTeam: UnifiedTeam;
  score?: {
    home?: number;
    away?: number;
  };
  venue?: string;
}
