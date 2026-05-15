import type { UnifiedTeam } from '../types/unified-team.js';
import type { UnifiedFixture } from '../types/unified-fixture.js';
import type { UnifiedStanding } from '../types/unified-standing.js';

function isRicherString(primary: string | undefined, secondary: string | undefined): string | undefined {
  if (!primary && secondary) return secondary;
  if (!primary) return undefined;
  if (!secondary) return primary;
  return primary.length >= secondary.length ? primary : secondary;
}

function mergeProviderIds(
  a: UnifiedTeam['providerIds'],
  b: UnifiedTeam['providerIds'],
): UnifiedTeam['providerIds'] {
  return {
    footballData: a.footballData ?? b.footballData,
    sportmonks: a.sportmonks ?? b.sportmonks,
  };
}

export function mergeTeams(primary: UnifiedTeam, secondary: UnifiedTeam): UnifiedTeam {
  return {
    id: primary.id,
    providerIds: mergeProviderIds(primary.providerIds, secondary.providerIds),
    name: primary.name || secondary.name,
    shortName: isRicherString(primary.shortName, secondary.shortName),
    country: primary.country ?? secondary.country,
    logo: primary.logo ?? secondary.logo,
    founded: primary.founded ?? secondary.founded,
    venue: {
      name: primary.venue?.name ?? secondary.venue?.name,
      city: primary.venue?.city ?? secondary.venue?.city,
      capacity: primary.venue?.capacity ?? secondary.venue?.capacity,
      image: primary.venue?.image ?? secondary.venue?.image,
    },
  };
}

export function mergeFixtures(primary: UnifiedFixture, secondary: UnifiedFixture): UnifiedFixture {
  return {
    id: primary.id,
    providerIds: {
      footballData: primary.providerIds.footballData ?? secondary.providerIds.footballData,
      sportmonks: primary.providerIds.sportmonks ?? secondary.providerIds.sportmonks,
    },
    competition: {
      id: primary.competition?.id ?? secondary.competition?.id,
      name: primary.competition?.name ?? secondary.competition?.name,
      code: primary.competition?.code ?? secondary.competition?.code,
    },
    season: primary.season ?? secondary.season,
    matchday: primary.matchday ?? secondary.matchday,
    utcDate: primary.utcDate,
    status: primary.status || secondary.status,
    homeTeam: mergeTeams(primary.homeTeam, secondary.homeTeam),
    awayTeam: mergeTeams(primary.awayTeam, secondary.awayTeam),
    score: {
      home: primary.score?.home ?? secondary.score?.home,
      away: primary.score?.away ?? secondary.score?.away,
    },
    venue: primary.venue ?? secondary.venue,
  };
}

export function mergeStandings(
  primary: UnifiedStanding,
  secondary: UnifiedStanding,
): UnifiedStanding {
  return {
    id: primary.id,
    providerIds: {
      footballData: primary.providerIds.footballData ?? secondary.providerIds.footballData,
      sportmonks: primary.providerIds.sportmonks ?? secondary.providerIds.sportmonks,
    },
    league: {
      id: primary.league.id ?? secondary.league.id,
      name: primary.league.name || secondary.league.name,
      code: primary.league.code ?? secondary.league.code,
      season: primary.league.season ?? secondary.league.season,
    },
    team: mergeTeams(primary.team, secondary.team),
    position: primary.position,
    playedGames: primary.playedGames,
    won: primary.won,
    draw: primary.draw,
    lost: primary.lost,
    goalsFor: primary.goalsFor,
    goalsAgainst: primary.goalsAgainst,
    goalDifference: primary.goalDifference,
    points: primary.points,
    form: primary.form ?? secondary.form,
  };
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
