import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import axios from 'axios';
import { ImageType, ProviderName } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { createProviders } from '../providers/index.js';
import { logger } from '../utils/logger.js';

export class ImageSyncService {
  private readonly providers = createProviders();

  async syncTeamLogos(limit = 50): Promise<number> {
    const sportmonks = this.providers.get('sportmonks');
    if (!sportmonks) return 0;

    const teams = await sportmonks.getTeams({ leagueId: env.DEFAULT_LEAGUE_ID });
    let synced = 0;

    for (const team of teams.slice(0, limit)) {
      if (!team.logo || !team.providerIds.sportmonks) continue;

      const localPath = await this.downloadImage(team.logo, `teams/${team.id}`);
      if (!localPath) continue;

      await prisma.imageResource.upsert({
        where: {
          entityId_imageType_provider: {
            entityId: team.id,
            imageType: ImageType.team_logo,
            provider: ProviderName.sportmonks,
          },
        },
        create: {
          entityType: 'team',
          entityId: team.id,
          imageType: ImageType.team_logo,
          sourceUrl: team.logo,
          provider: ProviderName.sportmonks,
          localPath,
          lastSyncedAt: new Date(),
        },
        update: {
          sourceUrl: team.logo,
          localPath,
          lastSyncedAt: new Date(),
        },
      });

      if (team.venue?.image) {
        await this.syncVenueImage(team.id, team.venue.image);
      }

      synced += 1;
    }

    logger.info({ synced }, 'Team image sync completed');
    return synced;
  }

  private async syncVenueImage(teamId: string, imageUrl: string): Promise<void> {
    const localPath = await this.downloadImage(imageUrl, `venues/${teamId}`);
    if (!localPath) return;

    await prisma.imageResource.upsert({
      where: {
        entityId_imageType_provider: {
          entityId: teamId,
          imageType: ImageType.stadium_image,
          provider: ProviderName.sportmonks,
        },
      },
      create: {
        entityType: 'team',
        entityId: teamId,
        imageType: ImageType.stadium_image,
        sourceUrl: imageUrl,
        provider: ProviderName.sportmonks,
        localPath,
        lastSyncedAt: new Date(),
      },
      update: {
        sourceUrl: imageUrl,
        localPath,
        lastSyncedAt: new Date(),
      },
    });
  }

  private async downloadImage(url: string, relativePath: string): Promise<string | null> {
    try {
      const ext = path.extname(new URL(url).pathname) || '.png';
      const dir = path.join(env.IMAGE_LOCAL_CACHE_PATH, path.dirname(relativePath));
      await mkdir(dir, { recursive: true });

      const filePath = path.join(env.IMAGE_LOCAL_CACHE_PATH, `${relativePath}${ext}`);
      const response = await axios.get<NodeJS.ReadableStream>(url, {
        responseType: 'stream',
        timeout: 15000,
      });

      await pipeline(response.data, createWriteStream(filePath));
      return filePath;
    } catch (err: unknown) {
      logger.warn({ err, url }, 'Image download failed');
      return null;
    }
  }
}
