export interface SportMonksVenue {
  id: number;
  name: string;
  city_name?: string;
  capacity?: number;
  image_path?: string;
}

export interface SportMonksTeam {
  id: number;
  name: string;
  short_code?: string;
  founded?: number;
  image_path?: string;
  country_id?: number;
  venue_id?: number;
  venue?: SportMonksVenue;
}

export interface SportMonksParticipant {
  id: number;
  name: string;
  short_code?: string;
  image_path?: string;
  meta?: { location: 'home' | 'away' };
}

export interface SportMonksFixture {
  id: number;
  name: string;
  starting_at: string;
  state_id: number;
  venue_id?: number;
  league_id: number;
  season_id: number;
  round_id?: number;
  participants?: SportMonksParticipant[];
  scores?: Array<{
    description: string;
    participant_id: number;
    score: { goals: number };
  }>;
  league?: { id: number; name: string; image_path?: string };
  venue?: SportMonksVenue;
}

export interface SportMonksStandingDetail {
  id: number;
  participant_id: number;
  position: number;
  points: number;
  participant?: SportMonksTeam;
  details?: Array<{ type_id: number; value: number }>;
}

export interface SportMonksStandingsResponse {
  data: SportMonksStandingDetail[];
}

export interface SportMonksPaginatedResponse<T> {
  data: T[];
  pagination?: {
    count: number;
    per_page: number;
    current_page: number;
    has_more: boolean;
  };
}
