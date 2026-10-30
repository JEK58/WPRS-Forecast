# Local Setup Guide — WPRS Forecast

Stack: Next.js + Postgres + Redis. Use Node 24 and the pnpm version pinned in `package.json`.
`bun` is used for tests and the `db:import:competitions` script.

## Quickstart (automated)

```bash
./setup-local.sh
pnpm dev   # -> http://localhost:3000
```

The script is idempotent — safe to re-run. It:

1. Checks Node / pnpm / Docker (and warns if `bun` is missing).
2. Runs `pnpm install` (skip with `--skip-install`).
3. Creates `.env` with dummy defaults if none exists (never overwrites).
4. Starts Postgres via `./start-database.sh` and Redis via `docker-compose-dev.yml` (skip with `--skip-db`).
5. Runs `pnpm db:push` to create the schema (skip with `--skip-push`).

```bash
./setup-local.sh --help
./setup-local.sh --skip-install --skip-db --skip-push
```

## Manual setup

```bash
pnpm install
cp .env.example .env   # then fill in values (see table below)
./start-database.sh    # Postgres on localhost:5432
docker compose -f docker-compose-dev.yml up -d   # Redis on localhost:6379
pnpm db:push
pnpm dev
```

Useful commands:

```bash
pnpm build && pnpm start  # production check
pnpm db:studio            # inspect DB
pnpm lint
bun test --watch          # tests (or: pnpm test)
pnpm test:ci              # CI mode, no watch
pnpm db:import:competitions  # seed competitions (bun)
```

## Populate ranking data (required for real forecasts)

`pnpm db:push` creates an **empty** schema. Without CIVL ranking rows,
every forecast shows "No confirmed pilots yet / Potential WPRS -" because
`getPilotRankings` (`src/utils/get-forecast.ts`) finds nothing. With the dev
server running, import prod-equivalent data via the cron endpoint (uses your
local `API_KEY` from `.env`):

```bash
pnpm dev &
API_KEY=$(grep '^API_KEY=' .env | cut -d= -f2)
curl "http://localhost:3000/api/crons/fetch-world-ranking?apiKey=${API_KEY}"
# -> "done" (~7k ranking rows + ~470 recent comps)
```

⚠️ Order matters: if you opened a forecast **before** importing, every pilot
was cached in Redis as placeholder `99999` (`name:*` keys, 10-day TTL in
`src/utils/get-civl-ids.ts`), and the cache short-circuits the DB lookup even
after the import. Flush Redis and re-request:

```bash
docker compose -f docker-compose-dev.yml exec cache redis-cli FLUSHDB
```

## Environment variables

Source of truth is `src/env.js` (validated with zod at boot). `.env.example`
may lag behind — if boot fails on env validation, compare against `src/env.js`.

| Variable | Required to boot? | Local dummy OK? | Where does a real value come from? |
|---|---|---|---|
| `DATABASE_URL` | yes | n/a (local Postgres) | `postgresql://postgres:password@localhost:5432/wprs-forecast` when using `start-database.sh` |
| `POSTGRES_PASSWORD` | for docker | n/a | must match the password inside `DATABASE_URL` |
| `REDIS_URL` | no | yes / unset | `redis://localhost:6379` from `docker-compose-dev.yml`. `src/server/cache/redis.ts` returns `null` when unset — app runs, caching disabled |
| `API_KEY` | yes | yes (any random string) | **Self-chosen.** Protects cron endpoints (`src/pages/api/crons/populate-cache.ts`, `fetch-world-ranking.ts`, `import-competitions.ts`) via `?apiKey=...`. Generate: `openssl rand -hex 32`. No signup needed |
| `AIRTRIBUNE_API_KEY` | yes (schema) | yes for local dev | **Private partner key.** Accepted at `src/pages/api/worldranking/index.ts` and `civl-id.ts` to identify Airtribune callers. Not publicly obtainable — ask the project maintainer. Dummy boots the app; only that integration is untestable |
| `PILOT_UNION_API_KEY` | yes (schema) | yes for local dev | Same as above, for Pilot Union callers. Note: this var is required by `src/env.js` but was missing from `.env.example` |
| `OPENAI_API_KEY` | yes (schema) | boots with dummy, AI features fail gracefully | [platform.openai.com](https://platform.openai.com) → API keys → create key (`sk-...`). Used in `src/utils/get-start-and-end-date-from-range.ts` (`gpt-5.6-sol`) and `src/utils/get-max-pilots-from-description.ts` (`gpt-5.6-terra`). With a dummy key those helpers log an error and return `undefined` / `0` — the app still runs |
| `ALGOLIA_APP_ID` / `ALGOLIA_API_KEY` | yes (schema) | boots with dummy, search falls back | [algolia.com](https://www.algolia.com) dashboard → your application → API keys, index `civl_ranking`. Used in `src/utils/get-civl-ids.ts` as a fallback after local Minisearch. Dummy works; tests even run with `DISABLE_ALGOLIA = true` (`__tests__/find-pilot.test.ts`) |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | no | leave empty | Plausible dashboard → site-specific script URL. Analytics only |
| `NEXT_PUBLIC_SENTRY_DSN` | no | leave empty | Opt-in Sentry reporting for browser, server, and edge. Set your project DSN before building; changes require a rebuild. Docker Compose passes it as a build argument. Reporting also requires production mode. |
| `SENTRY_IGNORE_API_RESOLUTION_ERROR` | no | `1` | Sentry, prod-only |
| `CLOUDFLARE_*` / `TRAEFIK_DOMAIN` | no (prod backup) | leave empty | Cloudflare R2 credentials for `backup/` service, prod-only |

Reference: CI (`.github/workflows/ci.yml`) injects all of these from GitHub
Secrets plus `PILOT_UNION_API_KEY || 'ci-pilot-union-key'`, with Postgres/Redis
as service containers — the same pattern the setup script reproduces locally
with dummy values.

## Troubleshooting

- **Env validation error on `dev`/`build`:** an empty string counts as missing
  (`emptyStringAsUndefined: true` in `src/env.js`). Either set a real/dummy
  value or run with `SKIP_ENV_VALIDATION=1` (not recommended — masks config bugs).
- **Postgres auth failure:** `POSTGRES_PASSWORD` must match the password in
  `DATABASE_URL`. `setup-local.sh` generates a random one for you; if you
  created `.env` manually, keep the two in sync. Note `start-database.sh`
  refuses the literal default `password` and prompts interactively.
- **Port conflicts:** `start-database.sh` uses `5432`; `docker-compose.yml`'s
  `db` service uses `127.0.0.1:5433:5432`. Don't run both at once.
- **Redis connection errors:** unset `REDIS_URL` to run without cache, or
  `docker compose -f docker-compose-dev.yml up -d` to start it.
- **`bun` missing:** only needed for tests and `db:import:competitions`.
  Install from [bun.sh](https://bun.sh) if you need those.
