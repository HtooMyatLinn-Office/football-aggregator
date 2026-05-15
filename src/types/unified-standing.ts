import type { UnifiedTeam } from './unified-team.js';

export interface UnifiedStanding {
  id: string;
  providerIds: {
    footballData?: string;
    sportmonks?: string;
  };
  league: {
    id?: string;
    name: string;
    code?: string;
    season?: string;
  };
  team: UnifiedTeam;
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string;
}
