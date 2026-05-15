export interface UnifiedTeam {
  id: string;
  providerIds: {
    footballData?: string;
    sportmonks?: string;
  };
  name: string;
  shortName?: string;
  country?: string;
  logo?: string;
  founded?: number;
  venue?: {
    name?: string;
    city?: string;
    capacity?: number;
    image?: string;
  };
}
