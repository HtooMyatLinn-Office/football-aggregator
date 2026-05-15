import { z } from 'zod';

export const teamsQuerySchema = z.object({
  competitionCode: z.string().optional(),
  leagueId: z.coerce.number().optional(),
  seasonId: z.coerce.number().optional(),
});

export type TeamsQuery = z.infer<typeof teamsQuerySchema>;
