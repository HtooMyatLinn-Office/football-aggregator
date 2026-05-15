# Provider Capability Comparison

| Capability | football-data.io | SportMonks | Notes |
|------------|:----------------:|:----------:|-------|
| Teams list | ✅ | ✅ | Both normalize to `UnifiedTeam` |
| Fixtures / matches | ✅ | ✅ | SportMonks includes live state IDs |
| Standings | ✅ | ✅ | football-data primary for PL-style tables |
| Team logos | ✅ (`crest`) | ✅ (`image_path`) | SportMonks higher-res paths |
| Player images | ❌ | ✅ | Phase 2 endpoint |
| League logos | ✅ (`emblem`) | ✅ (`image_path`) | Stored in `image_resources` |
| Stadium / venue images | ⚠️ text only | ✅ (`venue.image_path`) | Aggregation merges venue image |
| Live scores | ❌ | ✅ | Not exposed in phase 1 API |
| Historical seasons | ✅ | ✅ | Via season/league IDs |
| Rate limits | Tier-based | Plan-based | Tracked in `provider_health` |

## Recommended Usage

| Use case | Primary | Secondary |
|----------|---------|-----------|
| Standings | football-data.io | SportMonks |
| Fixtures schedule | football-data.io | SportMonks |
| Team / venue images | SportMonks | football-data.io (crest) |
| Enrichment merge | Aggregation service | — |

## Environment

```env
PROVIDER_PRIORITY=footballData,sportmonks
```

Fallback order follows this list left-to-right.
