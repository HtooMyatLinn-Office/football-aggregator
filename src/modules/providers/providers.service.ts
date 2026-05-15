import { PROVIDER_CAPABILITIES } from '../../providers/index.js';
import type { ProviderHealthService, ProviderHealthSnapshot } from '../../services/provider-health.service.js';
import type { ProviderCapabilities, ProviderKey } from '../../types/provider.types.js';

export interface ProviderCapabilityRow {
  provider: ProviderKey;
  capabilities: ProviderCapabilities;
}

export class ProvidersService {
  constructor(private readonly health: ProviderHealthService) {}

  async getHealth(): Promise<ProviderHealthSnapshot[]> {
    return this.health.getAll();
  }

  getCapabilities(): ProviderCapabilityRow[] {
    return (Object.keys(PROVIDER_CAPABILITIES) as ProviderKey[]).map((provider) => ({
      provider,
      capabilities: PROVIDER_CAPABILITIES[provider],
    }));
  }
}
