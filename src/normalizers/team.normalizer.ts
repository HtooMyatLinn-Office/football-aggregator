import type { FootballdataTeam } from '../providers/football-data/football-data.types.js';
import type { SportMonksTeam } from '../providers/sportmonks/sportmonks.types.js';
import type { UnifiedTeam } from '../types/unified-team.js';

export function buildUnifiedTeamId(providerIds: UnifiedTeam['providerIds']): string {
  if (providerIds.footballData) {
    return `fd-${providerIds.footballData}`;
  }
  if (providerIds.sportmonks) {
    return `sm-${providerIds.sportmonks}`;
  }
  throw new Error('Cannot build unified team id without provider id');
}

export function normalizeFootballDataTeam(raw: FootballdataTeam): UnifiedTeam {
  const providerIds = { footballData: String(raw.team_id) };
  const founded =
    typeof raw.founded === 'string' ? parseInt(raw.founded, 10) || undefined : raw.founded;

  return {
    id: buildUnifiedTeamId(providerIds),
    providerIds,
    name: raw.team_name ?? raw.full_name ?? `Team ${raw.team_id}`,
    shortName: raw.short_name ?? raw.team_name_clean,
    country: raw.country,
    logo: raw.team_logo ?? raw.image ?? raw.logo,
    founded,
    venue:
      raw.venue_name || raw.stadium?.name
        ? {
            name: raw.venue_name ?? raw.stadium?.name ?? undefined,
            city: raw.venue_city ?? raw.stadium?.address ?? undefined,
            capacity: raw.venue_capacity,
          }
        : undefined,
  };
}

export function normalizeSportMonksTeam(raw: SportMonksTeam): UnifiedTeam {
  const providerIds = { sportmonks: String(raw.id) };
  return {
    id: buildUnifiedTeamId(providerIds),
    providerIds,
    name: raw.name,
    shortName: raw.short_code,
    logo: raw.image_path,
    founded: raw.founded,
    venue: raw.venue
      ? {
          name: raw.venue.name,
          city: raw.venue.city_name,
          capacity: raw.venue.capacity,
          image: raw.venue.image_path,
        }
      : undefined,
  };
}

export function normalizeSportMonksParticipant(
  raw: { id: number; name: string; short_code?: string; image_path?: string },
): UnifiedTeam {
  return normalizeSportMonksTeam({
    id: raw.id,
    name: raw.name,
    short_code: raw.short_code,
    image_path: raw.image_path,
  });
}
