import type { FootballdataStandingsPayload } from '../providers/football-data/football-data.types.js';
import type { SportMonksStandingDetail } from '../providers/sportmonks/sportmonks.types.js';
import type { UnifiedStanding } from '../types/unified-standing.js';
import { normalizeFootballDataTeam, normalizeSportMonksTeam } from './team.normalizer.js';

export function normalizeFootballDataStandings(
  payload: FootballdataStandingsPayload,
): UnifiedStanding[] {
  const leagueId = payload.league.league_id;
  const leagueName = payload.league.league_name ?? payload.league.name;
  const season =
    payload.season?.label ??
    (payload.season?.year ? String(payload.season.year) : undefined);

  return payload.standings.map((row) => {
    const teamId = row.team.team_id ?? row.team_id;
    if (teamId === undefined) {
      throw new Error(`Standing row at position ${row.position} missing team_id`);
    }

    const team = normalizeFootballDataTeam({
      team_id: teamId,
      team_name: row.team.team_name ?? row.team_name ?? `Team ${teamId}`,
      short_name: row.team.short_name ?? row.team.team_name_clean,
      country: row.team.country,
      team_logo: row.team.team_logo,
    });

    const playedGames =
      row.record?.matches_played ?? row.played_games ?? row.played ?? 0;
    const won = row.record?.wins ?? row.won ?? 0;
    const draw = row.record?.draws ?? row.draw ?? 0;
    const lost = row.record?.losses ?? row.lost ?? 0;
    const goalsFor = row.goals?.for ?? row.goals_for ?? 0;
    const goalsAgainst = row.goals?.against ?? row.goals_against ?? 0;
    const goalDifference = row.goals?.difference ?? row.goal_difference ?? goalsFor - goalsAgainst;
    const points = row.record?.points ?? row.points ?? 0;

    return {
      id: `fd-standing-${leagueId}-${teamId}`,
      providerIds: { footballData: `${leagueId}-${teamId}` },
      league: {
        id: String(leagueId),
        name: leagueName,
        season,
      },
      team,
      position: row.position,
      playedGames,
      won,
      draw,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      form: row.form,
    };
  });
}

const DETAIL_TYPE = {
  PLAYED: 129,
  WON: 130,
  DRAW: 131,
  LOST: 132,
  GOALS_FOR: 133,
  GOALS_AGAINST: 134,
  GOAL_DIFF: 179,
} as const;

function getDetailValue(details: SportMonksStandingDetail['details'], typeId: number): number {
  return details?.find((d) => d.type_id === typeId)?.value ?? 0;
}

export function normalizeSportMonksStandings(
  raw: SportMonksStandingDetail[],
  league: { id: number; name: string; code?: string; season?: string },
): UnifiedStanding[] {
  return raw.map((row) => {
    const teamRaw = row.participant;
    if (!teamRaw) {
      throw new Error(`SportMonks standing ${row.id} missing participant`);
    }
    const team = normalizeSportMonksTeam(teamRaw);
    return {
      id: `sm-standing-${league.id}-${row.participant_id}`,
      providerIds: { sportmonks: String(row.id) },
      league: {
        id: String(league.id),
        name: league.name,
        code: league.code,
        season: league.season,
      },
      team,
      position: row.position,
      playedGames: getDetailValue(row.details, DETAIL_TYPE.PLAYED),
      won: getDetailValue(row.details, DETAIL_TYPE.WON),
      draw: getDetailValue(row.details, DETAIL_TYPE.DRAW),
      lost: getDetailValue(row.details, DETAIL_TYPE.LOST),
      goalsFor: getDetailValue(row.details, DETAIL_TYPE.GOALS_FOR),
      goalsAgainst: getDetailValue(row.details, DETAIL_TYPE.GOALS_AGAINST),
      goalDifference: getDetailValue(row.details, DETAIL_TYPE.GOAL_DIFF),
      points: row.points,
    };
  });
}
