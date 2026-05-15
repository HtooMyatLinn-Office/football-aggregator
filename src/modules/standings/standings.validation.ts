import { z } from 'zod';

export const standingsQuerySchema = z.object({
  competitionCode: z.string().optional(),
  leagueId: z.coerce.number().optional(),
  seasonId: z.coerce.number().optional(),
  season: z.string().optional(),
});

export type StandingsQuery = z.infer<typeof standingsQuerySchema>;
