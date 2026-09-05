# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A linear-programming solver engine (Python, exposed over MCP) plus an API platform
(TypeScript/Express + Postgres) and a React dashboard. The two runtimes are
connected: Express validates and meters every MCP tool call via
`POST /internal/validate-key`, and `POST /v1/solve` forwards REST calls to the
Python solver — see [context.md](context.md) for exactly what was verified and how.
Dockerized and deploy-ready; see [DEPLOYMENT.md](DEPLOYMENT.md) for the AWS runbook.

- `opsmcp/` — Python compute layer. Solvers + MCP servers (SSE + stdio). Validates
  every tool call against Express before running it (`opsmcp/auth.py`).
- `api-platform/backend/` — Express 5 + TypeScript. Clerk auth, API keys, rate limits,
  Razorpay. Single source of truth for auth/quota/billing across both runtimes.
- `api-platform/client/` — React 19 + Vite + Tailwind v4 dashboard.

## Commands

Run these from the paths shown. The working directory matters — see the gotchas below.

### Python (`opsmcp`)

```bash
source opsmcp/.venv/bin/activate     # venv already exists at opsmcp/.venv

# All of these MUST run from the REPOSITORY ROOT, not from opsmcp/
python -m pytest opsmcp/tests -q     # 25 tests
python -m opsmcp.server              # SSE MCP server, port 3001
python -m opsmcp.server_stdio        # stdio MCP server (Claude Desktop)
```

### Backend (`api-platform/backend`)

```bash
docker compose up -d                 # Postgres 16 on :5432 (disposable, local only)
npm run db:push                      # push Drizzle schema — NEVER against Supabase from a dev machine
npm run dev                          # tsx watch, port 8080
npx tsc --noEmit                     # typecheck — not sufficient alone, see gotcha #6
npm run build && npm start           # the actual production path — run this before trusting a change
```

### Client (`api-platform/client`)

```bash
npm run dev                          # Vite, port 5173
npm run build                        # tsc -b && vite build — actually run this; see gotcha #6
npm run lint                         # eslint
```

### Full stack, containerized

```bash
docker compose up -d --build                             # local: postgres + backend + opsmcp
docker compose -f docker-compose.prod.yml up -d --build   # prod: no postgres, uses Supabase
```

## Gotchas that will bite you

1. **Python imports only resolve from the repository root.** There is no
   `opsmcp/__init__.py` and no `pyproject.toml`; `opsmcp` works as an implicit
   namespace package, so the root must be `sys.path[0]`. Both `cd opsmcp && python
   server.py` and `python opsmcp/server.py` fail with `ModuleNotFoundError: No module
   named 'opsmcp'`. Use `python -m opsmcp.server` from the root. (The README's
   Getting Started block is wrong on this.)

2. **`api-platform/` is a pnpm workspace** (`pnpm-workspace.yaml`, `pnpm-lock.yaml`)
   but `backend/` and `client/` each also carry a `package-lock.json`. Match whatever
   a directory already uses rather than switching package managers.

3. **There are no backend or frontend tests.** `npx tsc --noEmit` and `npm run lint`
   are the only automated checks. Do not claim a backend change is verified without
   at least a typecheck plus a `curl` against a running server.

4. **`api-platform/AGENTS.md` was rewritten and now matches the real stack** —
   TypeScript ESM, Postgres + Drizzle, SHA-256 key hashing, the Python layer live
   and wired in. It's kept in sync going forward; if you find it drifting again,
   fix it rather than assuming it's still accurate.

5. **`design-md/` does not exist.** It is gitignored and absent from this checkout.
   Use `api-platform/DESIGN_SYSTEM.md` instead — it is the real, self-contained source
   of design tokens.

6. **`npx tsc --noEmit` passing does not mean the production build works.** Both
   `tsx watch` (backend dev) and `vite dev` (client dev) use lenient loaders that
   hide real bugs: an extensionless subpath import into a CJS package
   (`razorpay/dist/utils/razorpay-utils`, needs a `.js`) threw
   `ERR_MODULE_NOT_FOUND` only under plain `node dist/index.js`, and an unused
   variable failed `tsc -b` (which `npm run build` runs) while `vite dev` never
   noticed. Before calling a change deploy-ready, run `npm run build && npm start`
   (backend) or `npm run build` (client) — or just build the Docker image, which
   forces both.

7. **`pnpm-workspace.yaml`'s `allowBuilds` must have real booleans.** If it ever
   reverts to placeholder values, `CI=true pnpm install --frozen-lockfile` — what
   every Docker build runs — exits 1 even though the same command looks like it
   just prints a warning interactively. Fix with `pnpm approve-builds --all`.

8. **Never run schema-push or destructive DB operations against Supabase.** Local
   dev and CI use the disposable `docker-compose.yml` Postgres
   (`postgresql://operations:operations@localhost:5432/operations`) exclusively.
   Production *does* use the Supabase project (see `DEPLOYMENT.md`), reached only
   via `DATABASE_URL` in `api-platform/backend/.env.production` — never push schema
   changes to it from a dev machine; do that deliberately, once, per change.

## Conventions

### Backend

- **ESM with explicit `.js` extensions on relative imports** (`from './schema.js'`),
  even though the sources are `.ts`. Required by `"type": "module"` + `tsx`. This
  also applies to subpath imports into third-party packages — see gotcha #6.
- `clerkMiddleware()` must stay scoped to routes that read `req.auth` (currently a
  `withClerk` instance applied to `/v1/keys` and `/v1/*`), never mounted globally.
  It throws synchronously on invalid Clerk env config, which previously took down
  `/health` and both webhooks along with everything else.
- Webhooks (`/v1/webhooks/*`) and `/internal/*` must stay mounted **before** any
  `requireUserId`-guarded `/v1` mount in `routes/index.ts` — Express runs a
  `use('/v1', ...)` mount's middleware for any path starting with `/v1`, including
  webhook paths, regardless of whether the sub-router matches.
- Layering is strict: `routes/` → `controllers/` → `services/` → `models/` →
  `config/database.ts`. Controllers never touch `db` directly; only `models/` do.
- `models/index.ts` re-exports every model; import from it, not individual files.
- DB columns are `snake_case`; JSON responses to the client are `camelCase`. The
  mapping happens in controllers.
- Drizzle rows get cast inline (`(user as { subscription_status: string })`) rather
  than typed through `types/index.ts`. Match this if extending; don't refactor it
  wholesale as a drive-by.

### Python

- One MCP tool per module in `tools/`, each exporting `TOOL_NAME`, `get_tool()`, and
  `execute(arguments) -> dict`. Register it in the `_TOOL_MODULES` dict in
  `tools/__init__.py` — that dict is the single registration point for both servers.
- Solver math lives in `core/`; Pydantic schemas in `models/`; result shaping in
  `tools/_common.py::_build_result`. Keep the split.
- Every tool description ends with `EXECUTIVE_PROMPT` from `tools/_common.py`.
- Variable naming is enforced by a regex (`^[xsa][1-9][0-9]*$`): `x` decision,
  `s` slack/surplus, `a` artificial.

### Frontend

- Dark-mode first, near-black canvas, monospace for data/tableaux, sans for UI.
  Tokens are in `DESIGN_SYSTEM.md` and wired through `client/src/index.css`.
- Lucide icons only. No gradient orbs or decorative blobs — this is infrastructure UI.
- All API calls go through `client/src/utils/api.ts::apiFetch`, which attaches the
  Clerk JWT and `X-Timezone` and converts 402 → `PaymentRequiredError`,
  429 → `RateLimitError`. Use it rather than raw `fetch`.

## Before changing auth, keys, or billing

Read `api-platform/IMPLEMENTATION_PLAN.md` for intended behavior and
[context.md](context.md) for what is actually wired. The two disagree in places, and
context.md records which side was verified against running code.

Invariants worth preserving:

- Express is the single source of truth for auth, quotas, and billing. Never
  duplicate that logic into the Python layer — `opsmcp` calls back into
  `POST /internal/validate-key` for every tool call rather than checking keys
  itself.
- Raw API keys are returned exactly once, at creation. Only the SHA-256 hash and a
  mask are stored, and list endpoints must never return raw keys.
- `POST /internal/validate-key` is service-to-service only, guarded by a shared
  secret (`X-Internal-Secret` / `INTERNAL_API_SECRET`), not Clerk. It must never be
  reverse-proxied to the public internet — the production `Caddyfile`
  deliberately has no route for `/internal/*`; keep it that way if you touch it.
- MCP and REST calls share one quota: both `POST /v1/solve` and the MCP path (via
  `/internal/validate-key`) call the same `checkAndIncrement`, against the same
  `key_usage` row per key. Don't introduce a second, separate counter.
