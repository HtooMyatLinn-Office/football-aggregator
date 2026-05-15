import { ProviderName, SyncStatus } from '@prisma/client';
import { prisma } from './prisma.js';
import type { UnifiedTeam } from '../types/unified-team.js';
import type { UnifiedFixture } from '../types/unified-fixture.js';
import type { UnifiedStanding } from '../types/unified-standing.js';
import type { ProviderKey } from '../types/provider.types.js';
import { logger } from '../utils/logger.js';

function toProviderName(key: ProviderKey): ProviderName {
  return key === 'footballData' ? ProviderName.footballData : ProviderName.sportmonks;
}

export class PersistenceService {
  async upsertTeams(teams: UnifiedTeam[]): Promise<number> {
    let count = 0;
    for (const team of teams) {
      await prisma.team.upsert({
        where: { unifiedId: team.id },
        create: {
          unifiedId: team.id,
          name: team.name,
          shortName: team.shortName,
          country: team.country,
          logoUrl: team.logo,
          founded: team.founded,
          venueName: team.venue?.name,
          venueCity: team.venue?.city,
          venueCapacity: team.venue?.capacity,
          venueImageUrl: team.venue?.image,
          rawPayload: team as object,
        },
        update: {
          name: team.name,
          shortName: team.shortName,
          country: team.country,
          logoUrl: team.logo,
          founded: team.founded,
          venueName: team.venue?.name,
          venueCity: team.venue?.city,
          venueCapacity: team.venue?.capacity,
          venueImageUrl: team.venue?.image,
          rawPayload: team as object,
        },
      });

      await this.upsertProviderMappings(team.id, 'team', team.providerIds);
      count += 1;
    }
    return count;
  }

  async upsertFixtures(fixtures: UnifiedFixture[]): Promise<number> {
    let count = 0;
    for (const fixture of fixtures) {
      await prisma.fixture.upsert({
        where: { unifiedId: fixture.id },
        create: {
          unifiedId: fixture.id,
          status: fixture.status,
          utcDate: new Date(fixture.utcDate),
          matchday: fixture.matchday,
          homeScore: fixture.score?.home,
          awayScore: fixture.score?.away,
          venue: fixture.venue,
          rawPayload: fixture as object,
        },
        update: {
          status: fixture.status,
          utcDate: new Date(fixture.utcDate),
          matchday: fixture.matchday,
          homeScore: fixture.score?.home,
          awayScore: fixture.score?.away,
          venue: fixture.venue,
          rawPayload: fixture as object,
        },
      });
      count += 1;
    }
    return count;
  }

  async upsertStandings(standings: UnifiedStanding[]): Promise<number> {
    let count = 0;
    for (const row of standings) {
      try {
        await prisma.standing.upsert({
          where: { unifiedId: row.id },
          create: {
            unifiedId: row.id,
            position: row.position,
            playedGames: row.playedGames ?? 0,
            won: row.won ?? 0,
            draw: row.draw ?? 0,
            lost: row.lost ?? 0,
            goalsFor: row.goalsFor ?? 0,
            goalsAgainst: row.goalsAgainst ?? 0,
            goalDifference: row.goalDifference ?? 0,
            points: row.points ?? 0,
            form: row.form,
            season: row.league.season,
            rawPayload: row as object,
          },
          update: {
            position: row.position,
            playedGames: row.playedGames ?? 0,
            won: row.won ?? 0,
            draw: row.draw ?? 0,
            lost: row.lost ?? 0,
            goalsFor: row.goalsFor ?? 0,
            goalsAgainst: row.goalsAgainst ?? 0,
            goalDifference: row.goalDifference ?? 0,
            points: row.points ?? 0,
            form: row.form,
            season: row.league.season,
            rawPayload: row as object,
          },
        });
        count += 1;
      } catch (err: unknown) {
        logger.warn({ err, unifiedId: row.id }, 'Standing upsert failed');
      }
    }
    return count;
  }

  async logSync(
    provider: ProviderKey,
    entityType: string,
    status: SyncStatus,
    recordsCount: number,
    durationMs: number,
    errorMessage?: string,
  ): Promise<void> {
    await prisma.syncLog.create({
      data: {
        provider: toProviderName(provider),
        entityType,
        status,
        recordsCount,
        durationMs,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  async findTeamByUnifiedId(unifiedId: string): Promise<UnifiedTeam | null> {
    const row = await prisma.team.findUnique({ where: { unifiedId } });
    if (!row) return null;
    return {
      id: row.unifiedId,
      providerIds: {},
      name: row.name,
      shortName: row.shortName ?? undefined,
      country: row.country ?? undefined,
      logo: row.logoUrl ?? undefined,
      founded: row.founded ?? undefined,
      venue: {
        name: row.venueName ?? undefined,
        city: row.venueCity ?? undefined,
        capacity: row.venueCapacity ?? undefined,
        image: row.venueImageUrl ?? undefined,
      },
    };
  }

  private async upsertProviderMappings(
    unifiedEntityId: string,
    entityType: string,
    providerIds: UnifiedTeam['providerIds'],
  ): Promise<void> {
    const entries: Array<{ provider: ProviderKey; id: string }> = [];
    if (providerIds.footballData) {
      entries.push({ provider: 'footballData', id: providerIds.footballData });
    }
    if (providerIds.sportmonks) {
      entries.push({ provider: 'sportmonks', id: providerIds.sportmonks });
    }

    for (const entry of entries) {
      try {
        await prisma.providerMapping.upsert({
          where: {
            provider_providerEntityId_entityType: {
              provider: toProviderName(entry.provider),
              providerEntityId: entry.id,
              entityType,
            },
          },
          create: {
            unifiedEntityId,
            entityType,
            provider: toProviderName(entry.provider),
            providerEntityId: entry.id,
          },
          update: { unifiedEntityId },
        });
      } catch (err: unknown) {
        logger.warn({ err, unifiedEntityId, entry }, 'Provider mapping upsert failed');
      }
    }
  }
}
