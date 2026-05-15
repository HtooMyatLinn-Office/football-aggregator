# Football Data Aggregator API — Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000` (default)  
**API prefix:** `/api/v1`

This API aggregates football data from [footballdata.io](https://footballdata.io/documentation/endpoints/) and [SportMonks](https://docs.sportmonks.com/football/) into a single normalized format.

---

## Table of contents

1. [Authentication](#authentication)
2. [Response format](#response-format)
3. [Error codes](#error-codes)
4. [Query parameters](#query-parameters)
5. [Endpoints](#endpoints)
6. [Data models](#data-models)
7. [Providers & fallback](#providers--fallback)
8. [Postman](#postman)

---

## Authentication

The public REST API does **not** require client authentication. Provider API keys are configured server-side in `.env`.

| Variable | Description |
|----------|-------------|
| `FOOTBALL_DATA_API_KEY` | footballdata.io Bearer token |
| `SPORTMONKS_API_KEY` | SportMonks API token |

---

## Response format

### Success (HTTP 200)

```json
{
  "success": true,
  "data": {},
  "meta": {
    "source": "provider",
    "cached": false,
    "providers": ["footballData"],
    "total": 20
  }
}
```

| `meta` field | Type | Description |
|--------------|------|-------------|
| `source` | `"provider"` \| `"cache"` | Where data came from |
| `cached` | `boolean` | `true` if served from Redis stale cache |
| `providers` | `string[]` | Providers used successfully |
| `total` | `number` | Item count in `data` (list endpoints) |

### Error

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Sample error files: [docs/samples/](samples/).

---

## Error codes

| HTTP | `code` | Description |
|------|--------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid query parameters |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `PROVIDER_UNAVAILABLE` | Provider rate limit |
| 503 | `PROVIDER_UNAVAILABLE` | All providers failed, no cache |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Query parameters

Shared query parameters (not all apply to every endpoint):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `leagueId` | `number` | No | League/competition ID. **footballdata.io:** public `league_id` (e.g. `10` = La Liga). **SportMonks:** season/league id (often different; see `DEFAULT_LEAGUE_ID` in `.env`). |
| `seasonId` | `number` | No | Season filter (footballdata.io `season_id`) |
| `dateFrom` | `string` | No | Fixtures only. `YYYY-MM-DD` |
| `dateTo` | `string` | No | Fixtures only. `YYYY-MM-DD` |
| `competitionCode` | `string` | No | Deprecated. Use `leagueId`. |

**Defaults** (when omitted):

- footballdata.io → `FOOTBALL_DATA_LEAGUE_ID` (default `10`)
- SportMonks → `DEFAULT_LEAGUE_ID` (default `8`)

> **Note:** `leagueId` is **not** the provider name. Providers are selected via `PROVIDER_PRIORITY` on the server.

---

## Endpoints

### Health check

```
GET /health
```

No API prefix. Does not call external providers.

**Response 200**

```json
{
  "status": "ok",
  "timestamp": "2026-05-15T12:00:00.000Z"
}
```

---

### List teams

```
GET /api/v1/teams
```

**Query parameters:** `leagueId`, `seasonId`

**Example**

```http
GET /api/v1/teams?leagueId=10
```

**Response `data`:** `UnifiedTeam[]`

See [samples/teams-success.json](samples/teams-success.json).

---

### Get team by ID

```
GET /api/v1/teams/:id
```

**Path parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | Unified team ID (e.g. `fd-77`, `sm-8`) |

**Example**

```http
GET /api/v1/teams/fd-77
```

**Response `data`:** `UnifiedTeam`

**Errors:** `404` if not found in DB or current provider fetch.

---

### List fixtures

```
GET /api/v1/fixtures
```

**Query parameters:** `leagueId`, `seasonId`, `dateFrom`, `dateTo`

**Example**

```http
GET /api/v1/fixtures?leagueId=10&dateFrom=2024-08-01&dateTo=2024-08-31
```

**Response `data`:** `UnifiedFixture[]`

See [samples/fixtures-success.json](samples/fixtures-success.json).

---

### List standings

```
GET /api/v1/standings
```

**Query parameters:** `leagueId`, `seasonId`

**Example**

```http
GET /api/v1/standings?leagueId=10
GET /api/v1/standings?leagueId=10&seasonId=105
```

**Response `data`:** `UnifiedStanding[]`

See [samples/standings-success.json](samples/standings-success.json).

---

### Provider health & capabilities

```
GET /api/v1/providers/health
```

Returns provider health metrics and capability matrix.

**Response `data`:**

```json
{
  "health": [ /* ProviderHealthSnapshot[] */ ],
  "capabilities": [ /* per-provider feature flags */ ]
}
```

See [samples/providers-health-success.json](samples/providers-health-success.json) and [provider-capabilities.md](provider-capabilities.md).

---

## Data models

### UnifiedTeam

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unified ID (`fd-{id}` or `sm-{id}`) |
| `providerIds` | `object` | `footballData?`, `sportmonks?` external IDs |
| `name` | `string` | Display name |
| `shortName` | `string?` | Short code |
| `country` | `string?` | Country |
| `logo` | `string?` | Logo URL |
| `founded` | `number?` | Year founded |
| `venue` | `object?` | `name`, `city`, `capacity`, `image` |

### UnifiedFixture

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unified fixture ID |
| `providerIds` | `object` | External IDs per provider |
| `competition` | `object?` | `id`, `name`, `code` |
| `season` | `string?` | Season label |
| `matchday` | `number?` | Matchday / round |
| `utcDate` | `string` | ISO 8601 datetime |
| `status` | `string` | Match status |
| `homeTeam` | `UnifiedTeam` | Home side |
| `awayTeam` | `UnifiedTeam` | Away side |
| `score` | `object?` | `home`, `away` goals |
| `venue` | `string?` | Venue name |

### UnifiedStanding

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unified standing row ID |
| `providerIds` | `object` | External IDs |
| `league` | `object` | `id`, `name`, `code`, `season` |
| `team` | `UnifiedTeam` | Team in table |
| `position` | `number` | Table position |
| `playedGames` | `number` | Matches played |
| `won` | `number` | Wins |
| `draw` | `number` | Draws |
| `lost` | `number` | Losses |
| `goalsFor` | `number` | Goals scored |
| `goalsAgainst` | `number` | Goals conceded |
| `goalDifference` | `number` | Goal difference |
| `points` | `number` | Points |
| `form` | `string?` | Recent form string |

---

## Providers & fallback

| Provider key | External API | Auth |
|--------------|--------------|------|
| `footballData` | `https://footballdata.io/api/v1` | `Authorization: Bearer` |
| `sportmonks` | `https://api.sportmonks.com/v3/football` | `api_token` query param |

**Fallback order** (configurable):

1. Try providers in `PROVIDER_PRIORITY` order
2. On failure, try next provider
3. If all fail, return stale **Redis** cache (if available)
4. Otherwise **503** `PROVIDER_UNAVAILABLE`

**Aggregation:** When multiple providers succeed, data is merged (richer fields preferred, e.g. logos from SportMonks + standings from footballdata.io).

---

## Postman

Import one of:

- [postman-collection.json](postman-collection.json) — ready-made collection
- [openapi.yaml](openapi.yaml) — OpenAPI 3.0 (Postman: Import → Link/File)

### Quick cURL examples

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/v1/teams?leagueId=10"
curl "http://localhost:3000/api/v1/standings?leagueId=10"
curl "http://localhost:3000/api/v1/fixtures?leagueId=10"
curl http://localhost:3000/api/v1/providers/health
```

---

## Rate limits & caching

| Entity | Default Redis TTL |
|--------|-------------------|
| Teams | 3600s (1h) |
| Fixtures | 300s (5m) |
| Standings | 600s (10m) |

Upstream provider rate limits apply per your API plan. Check `/api/v1/providers/health` for failure counts.
