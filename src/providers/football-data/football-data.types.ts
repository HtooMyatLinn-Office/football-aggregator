/** footballdata.io v1 API types — https://footballdata.io/api/v1 */

export interface FootballdataMeta {
  plan?: string;
  requests_used?: number;
  requests_limit?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface FootballdataApiResponse<T> {
  success: boolean;
  data: T;
  meta?: FootballdataMeta;
}

export interface FootballdataLeagueRef {
  league_id: number;
  name: string;
  country?: string;
  league_name?: string;
  image?: string;
}

export interface FootballdataTeam {
  team_id: number;
  team_name: string;
  team_name_clean?: string;
  team_name_english?: string;
  short_name?: string;
  full_name?: string;
  country?: string;
  team_logo?: string;
  image?: string;
  logo?: string;
  founded?: number | string;
  venue_name?: string;
  venue_city?: string;
  venue_capacity?: number;
  stadium?: {
    name?: string | null;
    address?: string | null;
  };
}

export interface FootballdataTeamsPayload {
  league: FootballdataLeagueRef;
  teams: FootballdataTeam[];
}

export interface FootballdataMatchTeam {
  team_id: number;
  team_name: string;
  team_name_clean?: string;
  short_name?: string;
  team_logo?: string;
  image?: string;
  logo?: string;
  country?: string;
}

export interface FootballdataMatch {
  match_id: number;
  match_date?: string;
  date_unix?: number;
  starting_at?: string;
  utc_date?: string;
  status?: string;
  game_week?: number;
  matchday?: number;
  round_id?: number;
  league_id?: number;
  home_team: FootballdataMatchTeam;
  away_team: FootballdataMatchTeam;
  home_score?: number;
  away_score?: number;
  score?: {
    home?: number;
    away?: number;
    full_time?: { home?: number; away?: number };
  };
  venue?: string | { stadium_name?: string; stadium_location?: string };
  league?: FootballdataLeagueRef;
  season?: { season_id?: number; year?: number; label?: string };
}

export interface FootballdataMatchesPayload {
  league: FootballdataLeagueRef;
  matches: FootballdataMatch[];
}

export interface FootballdataStandingTeam {
  team_id: number;
  team_name: string;
  team_name_clean?: string;
  short_name?: string;
  country?: string;
  team_logo?: string;
}

export interface FootballdataStandingRow {
  position: number;
  team_id?: number;
  team: FootballdataStandingTeam;
  team_name?: string;
  played?: number;
  played_games?: number;
  record?: {
    matches_played?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    points?: number;
  };
  goals?: {
    for?: number;
    against?: number;
    difference?: number;
  };
  won?: number;
  draw?: number;
  lost?: number;
  goals_for?: number;
  goals_against?: number;
  goal_difference?: number;
  points?: number;
  form?: string;
}

export interface FootballdataStandingsPayload {
  league: FootballdataLeagueRef;
  season?: { season_id?: number; year?: number; label?: string };
  standings: FootballdataStandingRow[];
}
