import type {
  FootballdataLeagueRef,
  FootballdataMatch,
  FootballdataMatchTeam,
} from '../providers/football-data/football-data.types.js';
import type { SportMonksFixture } from '../providers/sportmonks/sportmonks.types.js';
import type { UnifiedFixture } from '../types/unified-fixture.js';
import {
  normalizeFootballDataTeam,
  normalizeSportMonksParticipant,
} from './team.normalizer.js';

function footballdataMatchTeamToTeam(raw: FootballdataMatchTeam): Parameters<typeof normalizeFootballDataTeam>[0] {
  return {
    team_id: raw.team_id,
    team_name: raw.team_name,
    short_name: raw.short_name ?? raw.team_name_clean,
    team_logo: raw.team_logo ?? raw.image ?? raw.logo,
    country: raw.country,
  };
}

function parseMatchDate(raw: FootballdataMatch): string {
  if (raw.utc_date) return raw.utc_date;
  if (raw.starting_at) return raw.starting_at;
  if (raw.match_date) {
    const d = new Date(raw.match_date.replace(' ', 'T') + 'Z');
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return raw.match_date;
  }
  if (raw.date_unix) return new Date(raw.date_unix * 1000).toISOString();
  return new Date().toISOString();
}

function resolveVenue(raw: FootballdataMatch): string | undefined {
  if (typeof raw.venue === 'string') return raw.venue;
  if (raw.venue && typeof raw.venue === 'object') {
    return raw.venue.stadium_name;
  }
  return undefined;
}

export function normalizeFootballDataFixture(
  raw: FootballdataMatch,
  league: FootballdataLeagueRef,
): UnifiedFixture {
  const providerIds = { footballData: String(raw.match_id) };
  const homeScore = raw.score?.home ?? raw.score?.full_time?.home ?? raw.home_score;
  const awayScore = raw.score?.away ?? raw.score?.full_time?.away ?? raw.away_score;

  return {
    id: `fd-fixture-${raw.match_id}`,
    providerIds,
    competition: {
      id: String(league.league_id),
      name: league.league_name ?? league.name,
      code: league.country,
    },
    season: raw.season?.label ?? (raw.season?.year ? String(raw.season.year) : undefined),
    matchday: raw.game_week ?? raw.matchday ?? raw.round_id,
    utcDate: parseMatchDate(raw),
    status: raw.status ?? 'UNKNOWN',
    homeTeam: normalizeFootballDataTeam(footballdataMatchTeamToTeam(raw.home_team)),
    awayTeam: normalizeFootballDataTeam(footballdataMatchTeamToTeam(raw.away_team)),
    score: { home: homeScore, away: awayScore },
    venue: resolveVenue(raw),
  };
}

function resolveSportMonksParticipants(
  fixture: SportMonksFixture,
): { home: ReturnType<typeof normalizeSportMonksParticipant>; away: ReturnType<typeof normalizeSportMonksParticipant> } {
  const participants = fixture.participants ?? [];
  const homeRaw = participants.find((p) => p.meta?.location === 'home') ?? participants[0];
  const awayRaw = participants.find((p) => p.meta?.location === 'away') ?? participants[1];

  if (!homeRaw || !awayRaw) {
    throw new Error(`SportMonks fixture ${fixture.id} missing participants`);
  }

  return {
    home: normalizeSportMonksParticipant(homeRaw),
    away: normalizeSportMonksParticipant(awayRaw),
  };
}

function resolveSportMonksScore(
  fixture: SportMonksFixture,
  homeId: number,
  awayId: number,
): { home?: number; away?: number } {
  const currentScores = (fixture.scores ?? []).filter((s) => s.description === 'CURRENT');
  const homeScore = currentScores.find((s) => s.participant_id === homeId);
  const awayScore = currentScores.find((s) => s.participant_id === awayId);
  return {
    home: homeScore?.score.goals,
    away: awayScore?.score.goals,
  };
}

const SPORTMONKS_STATE_MAP: Record<number, string> = {
  1: 'NS',
  2: 'LIVE',
  3: 'HT',
  5: 'FT',
  6: 'AET',
  7: 'PEN_LIVE',
  8: 'FT_PEN',
};

export function normalizeSportMonksFixture(raw: SportMonksFixture): UnifiedFixture {
  const { home, away } = resolveSportMonksParticipants(raw);
  const providerIds = { sportmonks: String(raw.id) };
  const homeId = Number(home.providerIds.sportmonks);
  const awayId = Number(away.providerIds.sportmonks);

  return {
    id: `sm-fixture-${raw.id}`,
    providerIds,
    competition: raw.league
      ? {
          id: String(raw.league.id),
          name: raw.league.name,
        }
      : undefined,
    matchday: raw.round_id,
    utcDate: raw.starting_at,
    status: SPORTMONKS_STATE_MAP[raw.state_id] ?? `STATE_${raw.state_id}`,
    homeTeam: home,
    awayTeam: away,
    score: resolveSportMonksScore(raw, homeId, awayId),
    venue: raw.venue?.name,
  };
}
