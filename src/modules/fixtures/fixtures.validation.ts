import { z } from 'zod';

export const fixturesQuerySchema = z.object({
  competitionCode: z.string().optional(),
  leagueId: z.coerce.number().optional(),
  seasonId: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type FixturesQuery = z.infer<typeof fixturesQuerySchema>;
