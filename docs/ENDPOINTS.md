# API Endpoints — Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/v1/teams` | List teams |
| `GET` | `/api/v1/teams/:id` | Get team by unified ID |
| `GET` | `/api/v1/fixtures` | List fixtures/matches |
| `GET` | `/api/v1/standings` | List league standings |
| `GET` | `/api/v1/providers/health` | Provider health & capabilities |

## Query parameters cheat sheet

| Endpoint | `leagueId` | `seasonId` | `dateFrom` | `dateTo` |
|----------|:----------:|:----------:|:----------:|:--------:|
| `/teams` | ✓ | ✓ | — | — |
| `/fixtures` | ✓ | ✓ | ✓ | ✓ |
| `/standings` | ✓ | ✓ | — | — |

Full documentation: [API.md](./API.md)
