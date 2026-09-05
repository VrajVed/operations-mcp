# context.md

Working map of this repository: what exists, what actually runs, and where the
documentation has drifted from the code.

**Last verified:** 2026-08-15, against a working tree with the full stack built,
containerized, and exercised end-to-end (real Postgres, real MCP client, real
Docker images) — see §5 for what was actually run, not just read.

Everything marked *verified* below was checked by running code, not by reading docs.

---

## 1. Shape of the repo

```
operations-python/
├── CLAUDE.md                  # agent instructions
├── context.md                 # this file
├── README.md                  # user-facing overview
├── MVP_PLAN.md                # 4-phase roadmap — all phases now built, see §5
├── DEPLOYMENT.md              # AWS runbook (EC2/Lightsail + docker-compose + Caddy)
├── docker-compose.yml         # local full-stack build, disposable Postgres
├── docker-compose.prod.yml    # prod stack, no Postgres container (Supabase-backed)
├── Caddyfile                  # prod edge: TLS + reverse proxy
├── .env.prod.example          # DOMAIN, INTERNAL_API_SECRET, VITE_* build args
├── opsmcp/                    # Python compute layer
│   ├── core/                  # solver math
│   ├── models/                # Pydantic schemas
│   ├── tools/                 # MCP tool handlers + router
│   ├── utils/                 # tableau formatting
│   ├── tests/                 # 25 tests + 6 problem fixtures
│   ├── auth.py                # validates + meters keys against Express
│   ├── server.py              # SSE MCP server + REST bridge (:3001)
│   ├── server_stdio.py        # stdio MCP server
│   ├── requirements.txt
│   └── Dockerfile
└── api-platform/              # pnpm workspace
    ├── AGENTS.md              # rewritten this pass — was substantially stale
    ├── operations-mcp.md      # product philosophy (source of truth for product)
    ├── DESIGN_SYSTEM.md       # UI tokens (source of truth for design)
    ├── IMPLEMENTATION_PLAN.md # original auth/billing design — historical, see §6
    ├── .dockerignore
    ├── backend/                # Express 5 + TypeScript + Drizzle
    │   ├── Dockerfile
    │   ├── .env.production.example
    │   └── docker-compose.yml  # Postgres-only, for `npm run dev` without full stack
    └── client/                 # React 19 + Vite + Tailwind v4
        ├── Dockerfile           # multi-stage: vite build -> caddy static server
        ├── Caddyfile            # SPA fallback (try_files -> index.html)
        └── .dockerignore
```

Two runtimes, deliberately separated: Python owns math, Express owns identity,
quotas, and money. Express is the single source of truth for auth, billing, and rate
limiting — Python never duplicates that logic; it calls back into
`POST /internal/validate-key` for every MCP tool call.

---

## 2. Compute layer (`opsmcp/`) — working, and now auth-gated

**Verified:** 25/25 tests pass. A `solve_lp` call returns a correct, fully-populated
result, both directly and through the full container stack.

Four MCP tools, registered in one place (`tools/__init__.py::_TOOL_MODULES`) and
shared by both servers:

| Tool | Role |
|---|---|
| `solve_lp` | Default. Inspects the problem and delegates. |
| `simplex_solve` | Primal simplex — `max`, all `<=`, RHS ≥ 0 |
| `dual_simplex_solve` | Dual simplex — `min`, all `>=`, objective coeffs ≥ 0 |
| `big_m_solve` | Everything else: mixed operators, `=`, general LPs |

Routing logic lives in `tools/router.py::_select_solver` and falls through to Big-M.

### Auth (`opsmcp/auth.py`) — new this pass

Every MCP tool call goes through `validate_and_track(tool_name)` before executing.
Gated by `OPSMCP_REQUIRE_AUTH` (unset/false in local dev, `"true"` in
`docker-compose.prod.yml`). When enabled:

1. `extract_api_key()` reads the key from, in order: `Authorization: Bearer`,
   `X-Api-Key` header, `?apiKey=` query param.
2. The key is stashed in a `contextvars.ContextVar` set once per SSE connection
   (`handle_sse` in `server.py`) or once at stdio startup (`server_stdio.py`).
3. `validate_and_track` POSTs `{apiKey, tool}` to Express's
   `POST /internal/validate-key` (shared-secret guarded via `X-Internal-Secret`),
   which validates the key, checks/increments the *same* `key_usage` row the REST
   API uses, and logs the request.

**Verified live** (both against a bare `httpx`-backed fake Express and, later,
against the real containerized backend): missing key, invalid key, valid key, and
over-quota key all produce the correct MCP-level error payload or successful
result. Confirmed via a real `mcp.client.sse` session against a running
`docker compose` stack — both `?apiKey=` and `Authorization: Bearer` auth worked,
and `key_usage.total_requests`/`daily_count` incremented exactly once per
successful call, not per attempt (bad-key attempts are correctly not metered).

The `ContextVar` approach relies on `anyio`'s `task_group.start_soon()` (used
internally by the MCP SDK to dispatch each message as a new task) capturing a
snapshot of the calling task's context at spawn time — set once before
`server.run()`, it correctly propagates to every `call_tool()` for that
connection without touching MCP SDK-internal request-context machinery.

### REST bridge (`POST /solve` in `server.py`) — new this pass

A lightweight Starlette route alongside the SSE transport. Takes
`{"tool": ..., "input": ...}`, calls `execute_tool()` directly, returns the result
or a 400/500. **Does not re-check auth or quota** — that's enforced by Express
before it ever forwards here (see §3). `GET /health` also lives on this Starlette
app for container healthchecks.

### Packaging constraint (verified, unchanged)

No `opsmcp/__init__.py`, no `pyproject.toml`. `opsmcp` resolves as an implicit
namespace package, so **the repository root must be the working directory**:

| Command | Result |
|---|---|
| `python -m opsmcp.server` from root | works |
| `python -m pytest opsmcp/tests` from root | works |
| `cd opsmcp && python server.py` | `ModuleNotFoundError: No module named 'opsmcp'` |
| `python opsmcp/server.py` from root | `ModuleNotFoundError: No module named 'opsmcp'` |

`opsmcp/Dockerfile` uses `WORKDIR /app` + `COPY opsmcp/ ./opsmcp/` with a repo-root
build context specifically to preserve this — `docker-compose.yml`'s `opsmcp`
service build context is `.`, not `./opsmcp`.

### Empty placeholder files (unchanged)

`core/validators.py`, `utils/graphing.py`, `utils/latex.py` are 0 bytes. Imported
nowhere. Not touched this pass — out of scope, not blocking anything.

---

## 3. Platform layer (`api-platform/backend/`)

Express 5, TypeScript ESM, Drizzle ORM over Postgres. Entry `src/index.ts` → `:8080`.
`seedPlans()` runs at boot and exits the process if `DATABASE_URL` is unreachable.

### Route map (`src/routes/index.ts`) — current

```
GET    /health                     → open
GET    /api                        → validateApiKeyMiddleware  (legacy stub, kept for compat)
POST   /v1/solve                   → validateApiKeyMiddleware  (forwards to opsmcp)
POST   /v1/keys                    → clerkMiddleware + requireUserId
GET    /v1/keys                    → clerkMiddleware + requireUserId
DELETE /v1/keys/:id                → clerkMiddleware + requireUserId
GET    /v1/plans                   → clerkMiddleware + requireUserId
POST   /v1/subscriptions           → clerkMiddleware + requireUserId
GET    /v1/subscriptions/status    → clerkMiddleware + requireUserId
POST   /v1/webhooks/clerk          → open, svix-signature-verified
POST   /v1/webhooks/razorpay       → open, signature-verified
POST   /internal/validate-key      → requireInternalSecret (shared secret, not Clerk)
```

`clerkMiddleware()` is **scoped**, not global — see §4 for why that changed. Webhooks
and `/internal` are mounted before the guarded `/v1` mount, for the same routing-order
reason documented in §4.

### Schema (`src/config/schema.ts`) — unchanged

`users` (PK = Clerk ID) · `api_keys` · `key_usage` · `subscriptions` · `plans` ·
`request_logs`. All FKs cascade from `users.clerk_id`.

### Auth and keys — unchanged behavior, verified again post-fix

- Clerk via a `withClerk` middleware instance, applied only to `/v1/keys` and the
  rest of `/v1/*` (subscriptions/plans). `requireUserId` falls back to manual
  `clerkClient.authenticateRequest` when `req.auth.userId` is absent, and
  auto-creates the local user row on first authenticated request.
- `AUTHORIZED_PARTIES` (used by that manual-verification fallback) is now
  env-driven (`authGuard.ts`), not hardcoded to `localhost` — see §4.
- Keys: `opsmcp-` + 32 random bytes hex, SHA-256 hashed, `opsmcp-...abcd` mask.
  Raw key returned only at creation.
- First key for a user is free (`is_free = true`, `daily_limit = 2`). Additional
  keys require `subscription_status === 'active'`, else 402 with a checkout URL.
  Paid keys get `daily_limit = 999999` (effectively unlimited, but still counted).
- Rate limiting (`services/rateLimitService.ts::checkAndIncrement`): daily counter
  reset at midnight in the timezone from `X-Timezone`, default UTC. **Shared** by
  the REST solve path, the legacy `/api` path (free keys only, a pre-existing
  quirk — see the note below), and the MCP path via `/internal/validate-key` — one
  `key_usage` row per key regardless of which surface hit it. Verified: a key used
  once via MCP and once via `POST /v1/solve` showed `total_requests = 2` on the
  same row.

  Note: `GET /api`'s handler (`solverController.ts::getApi`) only calls
  `checkAndIncrement` when `keyRecord.is_free` — a narrower gate than the new
  `POST /v1/solve` and MCP paths, which meter unconditionally regardless of
  `is_free` (harmless for paid keys given the 999999 ceiling, but it does mean
  `/api` undercounts `total_requests` for paid keys). Pre-existing behavior on the
  legacy stub, not changed this pass — flagging in case it matters for analytics.

### Billing — unchanged, webhook path now actually reachable

Razorpay subscriptions, three seeded monthly INR plans. Webhook handles
`subscription.activated`, `.charged`, `.halted`, `.cancelled`, `.completed`, calls
`upgradeFreeKeysToPaid()` on activation. Both webhooks are now signature-verified
(Clerk via `svix`, added this pass; Razorpay already did this) and — critically —
now actually reachable, see §4.

---

## 4. What was fixed this pass (verified, not just patched)

### 4.1 Webhook 401 routing bug — fixed

Previously `router.use('/v1', requireUserId, subscriptionsRouter)` was mounted
before `router.use('/v1/webhooks', webhooksRouter)`. Express runs a
`use('/v1', ...)` mount's middleware for *any* path starting with `/v1`, so
`requireUserId` ran on webhook requests and returned 401 before the webhook router
was ever reached. Fixed by moving the webhooks mount (and the new `/internal`
mount) ahead of the guarded `/v1` mounts, and by dropping the duplicate
`/webhooks/razorpay` route that used to live inside `subscriptions.ts`.

**Verified against a running server**: `POST /v1/webhooks/razorpay` with a bad
signature now returns `400 "Invalid webhook signature"`, not `401` — proof the
request reaches the handler instead of being intercepted by the guard.

### 4.2 `clerkMiddleware()` blast radius — found and fixed

Not the original bug being chased, but discovered while verifying 4.1:
`clerkMiddleware()` was mounted globally in `index.ts`, ahead of all routes. It
does synchronous key parsing/validation on every request it wraps and **throws**
if the Clerk env config is invalid — meaning a bad `CLERK_PUBLISHABLE_KEY` or
`CLERK_SECRET_KEY` took down `/health`, both webhooks, and `/internal` too, none
of which use Clerk. Fixed by removing the global mount and instead applying a
single `withClerk = clerkMiddleware()` instance only to the two route groups that
read `req.auth` (`/v1/keys`, `/v1/*` subscriptions).

**Verified**: with a still-broken `CLERK_PUBLISHABLE_KEY` in the local `.env`,
`/health` now returns 200 and webhooks route correctly, while `/v1/plans` (a
genuinely Clerk-dependent route) still 500s — correctly isolated to just the
routes that need it, rather than leaking everywhere.

### 4.3 Hardcoded `authorizedParties` — found and fixed

`authGuard.ts`'s manual Clerk token verification fallback had
`authorizedParties: ['http://localhost:5173', 'http://localhost:8080']` hardcoded
— would have silently rejected every request once deployed to a real domain. Now
reads `AUTHORIZED_PARTIES` (comma-separated) from the environment, defaulting to
the same local dev origins when unset.

### 4.4 Clerk webhook signature never verified — fixed

`clerkWebhook` now verifies `svix-id`/`svix-timestamp`/`svix-signature` against
the raw request body using the `svix` package, matching what the Razorpay webhook
already did. Requires `express.raw()` ahead of `express.json()` on
`/v1/webhooks/*`, which was already in place.

### 4.5 `apiKeyService.ts` build-breaking typo — fixed

Line 1 had a stray leading `q`: `qimport { createHash, randomBytes } from 'crypto'`.
One-character fix; `npx tsc --noEmit` is clean.

### 4.6 pnpm workspace config was silently breaking non-interactive installs — fixed

`api-platform/pnpm-workspace.yaml`'s `allowBuilds` block had placeholder strings
(`'@clerk/shared': set this to true or false`) instead of real booleans. Harmless
interactively, but `CI=true pnpm install --frozen-lockfile` — exactly what a
Docker build does — **exited 1** because of it. Fixed by running
`pnpm approve-builds --all` to write real `true` values. This was the actual
blocker discovered while writing `backend/Dockerfile`; without it, the backend
image cannot build at all in CI or Docker.

### 4.7 Two production-only bugs surfaced by actually running the compiled build

Both `tsx watch` (dev) and `vite dev` (client dev) mask these; neither had ever
been exercised by `node dist/index.js` or `tsc -b && vite build` before this pass.

- **`razorpayService.ts`**: `import { validateWebhookSignature } from
  'razorpay/dist/utils/razorpay-utils'` (no `.js`) threw
  `ERR_MODULE_NOT_FOUND` under plain `node` — Node's ESM resolver requires
  explicit extensions on subpath imports, even into `node_modules`; `tsx`'s
  loader is more lenient. Fixed by adding `.js`. This also unmasked a real type
  error: `validateWebhookSignature` expects `body: string`, but the webhook
  route passes the raw `Buffer` express.raw() hands it — fixed with
  `payload.toString('utf8')` at the call site (previously suppressed entirely by
  an unrelated `@ts-ignore`, which is now removed since it's no longer needed).
- **`client/src/pages/Dashboard.tsx`**: an unused `loading` state variable
  (`TS6133`) failed `tsc -b`, which `npm run build` runs but `vite dev` doesn't.
  Removed (it gated no UI — dead state, not a missing loading spinner).

Both are exactly the kind of bug that "typecheck is clean" hides if you only ever
run the dev server — worth remembering before trusting `npx tsc --noEmit` alone as
proof a change is deploy-ready.

### 4.8 `Playground.tsx` / `Docs.tsx` were built but never routed — fixed

Both are complete, fully-styled components (200 and 290 lines), not stubs — the
landing page already links to `/playground` and `/docs`. `/playground` was
rendering an inline "Coming soon" placeholder instead of the real component, and
`/docs` had no route at all (a dead link). Wired both into `App.tsx`;
`Playground` stayed behind `ProtectedRoute` (matching its prior gating), `Docs`
was left public. Note `Playground.tsx` itself is a static/mocked demo — its
"Solve" button doesn't call the real API, it just reveals a hardcoded tableau.
Wiring the route was in scope for this pass; making it call `POST /v1/solve` for
real was not asked for and wasn't done.

---

## 5. What was built and verified this pass

### 5.1 `POST /v1/solve` — Express → Python bridge

New controller (`solverController.ts::postSolve`): validates the API key
(`validateApiKeyMiddleware`, same as `/api`), checks+increments quota via
`checkAndIncrement`, forwards `{tool, input}` to `${SOLVER_URL}/solve`, logs the
request via `logRequest` (previously dead code, now actually called), and returns
the solver's response with its own status code passed through.

**Verified end-to-end**, twice — once against locally-run processes, once against
the full `docker-compose.yml` stack: a real `solve_lp` call for a textbook 2-variable
LP returned the correct optimal solution (`x1=2, x2=6, objective=36`) through
`curl -> Express (container) -> opsmcp (container, over the compose network)`, and
`key_usage`/`request_logs` rows updated correctly. A malformed body correctly
returned the solver's own 400 with its validation error passed through; a missing
key returned 400 before ever reaching opsmcp.

### 5.2 Dockerization — all four services, both dev and prod compose files

- `opsmcp/Dockerfile` — `python:3.12-slim`, repo-root build context (see §2).
- `api-platform/backend/Dockerfile` — 3-stage (`deps` → `build` → `runtime`),
  `node:22-alpine`, pnpm pinned to `11.3.0` via corepack. **Must** be node:22+ —
  pnpm 11.x uses `node:sqlite`, a Node 22.13+ builtin; this broke on `node:20`
  with `ERR_UNKNOWN_BUILTIN_MODULE` before the base image was bumped. Build
  context is `api-platform/` (the pnpm workspace root), not `backend/` — pnpm
  needs the workspace manifest.
- `api-platform/client/Dockerfile` — 2-stage: `node:20-alpine` builds with `npm
  ci`/`npm run build` (client uses its own `package-lock.json`, not pnpm, despite
  being nominally in the pnpm workspace — matches its existing convention), then
  `caddy:2-alpine` serves the static output with an SPA-fallback Caddyfile
  (`try_files {path} /index.html`). `VITE_API_URL`/`VITE_CLERK_PUBLISHABLE_KEY`
  are build ARGs — Vite bakes `VITE_*` vars into the bundle at build time, not
  runtime.
- `docker-compose.yml` (root) — postgres + backend + opsmcp, all built from
  source, for local integration testing. Client isn't included here (its own
  Dockerfile is exercised directly or via the prod compose) — local frontend dev
  still uses `npm run dev` for HMR, per existing convention.
- `docker-compose.prod.yml` (root) — backend + opsmcp + client + a single edge
  Caddy container (TLS via Let's Encrypt, reverse-proxies `/sse`, `/messages/*`,
  `/v1/*`, `/api`, `/health` to the right service, everything else to the
  client). **Deliberately no Postgres service** — `DATABASE_URL` in
  `api-platform/backend/.env.production` points at the existing Supabase
  project. **Deliberately no `/internal/*` route in the Caddyfile** — that path
  must stay reachable only on the compose network.

**Verified**: all three custom images build clean from a cold cache. The full
`docker-compose.yml` stack was brought up, schema-pushed (against the
*containerized* disposable Postgres, never Supabase), and exercised through both
`POST /v1/solve` and a real MCP SSE session with `OPSMCP_REQUIRE_AUTH=true` — see
§5.1 and §2's auth section. The client image was built and run standalone;
`/` and an arbitrary SPA route (`/dashboard`) both returned 200 from the Caddy
static server, confirming the SPA fallback works.

### 5.3 `DEPLOYMENT.md` — AWS runbook

Covers: choosing EC2 free-tier vs. Lightsail (with the free-tier Elastic-IP gotcha
called out), DNS-before-TLS ordering, Docker install, the two env files needed
(`​.env` at root, `backend/.env.production`), one-time schema push against
Supabase, bringing up `docker-compose.prod.yml`, pointing Clerk/Razorpay webhooks
at the new domain, and day-2 ops (redeploy, logs, restart). Explicitly steers away
from NAT Gateway / ALB / RDS to keep cost near $0–5/month, matching the same
constraint that shaped the compose file split in §5.2.

---

## 6. Documentation drift — status after this pass

**`api-platform/AGENTS.md`** — rewritten this pass. Was substantially stale
(`index.js` vanilla JS, SQLite, MD5 hashing, "Python/FastAPI is unapproved future
scope" when the Python layer was already live). Now matches the real stack; the
four Coding Principles and Decision Checklist were preserved as-is per the
existing CLAUDE.md note that they're still house style.

**`IMPLEMENTATION_PLAN.md`** — not rewritten, left as historical design intent.
Its Clerk-middleware example (`app.use(clerkMiddleware())`, global mount) is
literally the anti-pattern behind §4.2's bug — a useful artifact of *why* the fix
mattered, not something to silently correct in place. Its API contract, pricing
table, and behavior matrix are otherwise still accurate.

**`MVP_PLAN.md`** — status table and "Build Order" section updated this pass; all
four phases are now marked built rather than pending. The Vision diagram at the
top was already accurate (it describes exactly the flow that now works) and
wasn't touched. One design question it left open (`/internal/validate-key` bound
to `localhost`) was resolved differently in practice — shared-secret guard
instead of IP-binding, since backend and opsmcp run as separate containers — and
that resolution is now noted inline in the doc.

**`opsmcp/README.md`** — still a single heading, no content. Not touched; out of
scope for this pass and not misleading (there's nothing there to contradict
reality).

**Two data issues in the local dev `.env`, not code bugs, still unresolved**:
`CLERK_PUBLISHABLE_KEY` decodes (via `@clerk/shared`'s internal `isomorphicAtob`)
to a value with a stray trailing control byte after the expected `

, failing
Clerk's own validity check; `CLERK_WEBHOOK_SECRET` is present as a line in `.env`
but empty after the `=`. Both need to be re-copied from the Clerk dashboard by
whoever owns that `.env` — not something fixable by guessing a value.

---

## 7. Suggested order of remaining work

Everything in the original §7 (fix the compile error, fix webhook mounting, add
svix verification, build `/v1/solve`, route the orphaned pages, rewrite
`AGENTS.md`) is done — see §4 and §4.8. What's left is either genuinely out of
scope for "get to deployable" or blocked on something only the repo owner can do:

1. Re-copy `CLERK_PUBLISHABLE_KEY` and `CLERK_WEBHOOK_SECRET` from the Clerk
   dashboard into the local dev `.env` (§6) — needed before Clerk-guarded routes
   or the Clerk webhook will work locally again.
2. Follow `DEPLOYMENT.md` to actually stand up the box — provisioning and the
   final `docker compose up` on real infrastructure were out of reach for this
   pass (no interactive AWS auth available here).
3. If `GET /api`'s narrower quota-metering gate (§3, the `is_free`-only check)
   turns out to matter for paid-key analytics, align it with `POST /v1/solve`'s
   unconditional metering — flagged, not fixed, since `/api` is a kept-for-compat
   stub and changing its metering behavior wasn't asked for.
