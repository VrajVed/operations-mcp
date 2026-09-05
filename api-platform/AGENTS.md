# AGENTS.md — Operations MCP Platform

Compact instruction file for OpenCode sessions working in this repository.
(Claude Code sessions: see the repository-root `CLAUDE.md` instead — it's
kept current against running code. This file's stack/command sections below
were out of date until this rewrite; the Coding Principles and Decision
Checklist sections are house style and apply regardless of which agent is
reading this.)

---

## Coding Principles (Mandatory)

Every change must follow these four rules. No exceptions.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- Present tradeoffs — don't pick silently when multiple paths exist.
- Push back when warranted. Simpler approaches are better than clever ones.
- If something is unclear, stop. Name what's confusing, then ask.

### 2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Touch only what you must. Don't "improve" adjacent code or formatting.
- Match existing style, even if you'd do it differently.
- Remove only imports/variables/functions that YOUR changes made unused.
- Don't delete pre-existing dead code unless asked.

### 4. Goal-Driven Execution
- Define verifiable success criteria before starting.
- For multi-step tasks, state a brief plan with verify steps:
  ```
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  ```
- Transform vague requests into concrete, testable goals.

---

## Project Overview

**Operations MCP Platform** — an LP/optimization solver engine (Python,
`opsmcp/`, exposed over MCP) fronted by an API platform (`api-platform/`)
that owns auth, API keys, quotas, and billing, plus a React dashboard.

- **Compute layer**: Python (`opsmcp/`) — solvers + MCP servers (SSE and
  stdio transports). No auth of its own beyond validating keys against the
  backend (see `opsmcp/auth.py`).
- **Platform layer**: `api-platform/backend/` — Express 5 + TypeScript,
  Postgres via Drizzle, Clerk auth, API keys, rate limits, Razorpay billing.
- **Frontend**: `api-platform/client/` — React 19 + Vite + Tailwind v4.
  Dark-mode first, terminal-inspired, developer-centric, data-dense.
- **Product spec source of truth**: `operations-mcp.md` (read before any
  product decisions — this is vision/philosophy, not implementation status).
- **Implementation history**: `IMPLEMENTATION_PLAN.md` describes the
  *original* auth/billing design; it has since diverged from what's actually
  running in places (e.g. its Clerk middleware example shows a global
  mount, which turned out to be a real bug — see below). Treat it as
  historical intent, not current fact.

The platform's ideal feel: *Stripe for optimization APIs, Vercel for
computational tooling, OpenRouter for solver access.*

---

## Architecture

```
operations-python/
├── opsmcp/                     # Python compute layer
│   ├── server.py               # SSE MCP server + REST bridge, port 3001
│   ├── server_stdio.py         # stdio MCP server (Claude Desktop)
│   ├── auth.py                 # validates/meters keys against the backend
│   ├── core/                   # solver math
│   ├── models/                 # Pydantic schemas
│   └── tools/                  # one MCP tool per module
├── api-platform/
│   ├── backend/                # Express 5 + TypeScript, port 8080
│   │   └── src/
│   │       ├── routes/ → controllers/ → services/ → models/ → config/database.ts
│   ├── client/                 # React 19 + Vite, port 5173
│   ├── pnpm-workspace.yaml     # backend + client are a pnpm workspace
│   └── DESIGN_SYSTEM.md        # design tokens — read this, not design-md/
├── docker-compose.yml          # local full-stack build (disposable Postgres)
├── docker-compose.prod.yml     # production stack (no Postgres container —
│                                #   uses the Supabase project via DATABASE_URL)
└── DEPLOYMENT.md               # AWS runbook
```

- **Backend entrypoint**: `npm run dev` (tsx watch) → `http://localhost:8080`,
  or `npm run build && npm start` for the compiled prod path.
- **Active backend endpoints**:
  - `GET /api?apiKey=...` — legacy solver stub, kept for backward compat
  - `POST /v1/solve` — forwards `{tool, input}` to the Python solver, API-key
    auth + quota enforced here before the request reaches opsmcp
  - `POST /v1/keys`, `GET /v1/keys`, `DELETE /v1/keys/:id` — API key CRUD
    (Clerk session auth)
  - `GET /v1/plans`, `POST /v1/subscriptions`, `GET /v1/subscriptions/status`
  - `POST /v1/webhooks/clerk`, `POST /v1/webhooks/razorpay` — svix/Razorpay
    signature-verified webhooks
  - `POST /internal/validate-key` — service-to-service only, shared-secret
    guarded, called by opsmcp to validate+meter MCP tool calls. Never
    reverse-proxied to the public internet (see the root `Caddyfile`).
- **Database**: Postgres via Drizzle. Local dev and CI use a disposable
  `docker-compose.yml` Postgres; both local *and production* auth flows point
  at the same Supabase project for actual user data (see the project's
  database decision in `context.md`) — **never** run schema-push or
  destructive operations against Supabase from a dev machine.
- Auth: Clerk (dashboard sessions) + SHA-256-hashed API keys (MCP/REST calls).
- Billing: Razorpay (test mode in development).

---

## Developer Commands

```bash
# Compute layer — from the repository root (opsmcp has no pyproject.toml;
# imports only resolve with the repo root as sys.path[0])
source opsmcp/.venv/bin/activate
python -m pytest opsmcp/tests -q
python -m opsmcp.server            # SSE, port 3001

# Backend — api-platform/backend/, pnpm-managed despite the committed
# package-lock.json (use `pnpm --filter backend add X`, not `npm install X`)
docker compose up -d               # local disposable Postgres
npm run db:push
npm run dev
npx tsc --noEmit                   # the only backend verification available

# Client — api-platform/client/
npm run dev
npm run build                      # tsc -b && vite build — actually run this
                                    # before shipping; the dev server doesn't
                                    # typecheck and has hidden the same class
                                    # of build-only bug backend hit (see below)

# Full stack, containerized
docker compose up -d --build                       # local, disposable Postgres
docker compose -f docker-compose.prod.yml up -d --build   # prod, Supabase-backed
```

---

## Design System References

`design-md/` does not exist in this checkout — it's gitignored. Use
`api-platform/DESIGN_SYSTEM.md` instead; it's the real, self-contained source
of color tokens, typography, and component specs for this project.

---

## Frontend Conventions

- **Dark mode first** — canvas should be near-black (#010102 to #07080a range)
- **Monospace for code/data** — JetBrains Mono / DM Mono for matrix/tableau displays
- **Sans for UI** — Inter / Geist / system-ui for navigation, labels, body
- **No gradient orbs/blobs** as decoration — this is infrastructure software, not SaaS marketing
- **Dense but readable** — prioritize tables, grids, clear hierarchy over whitespace
- **Cards at ≤8px radius** unless design system explicitly requires otherwise
- Use **Lucide icons** in buttons; never custom SVG icons where Lucide has an equivalent
- Respect `prefers-reduced-motion`; animate only `transform` and `opacity`
- Minimum touch target: 44×44 px; minimum body font size: 16px
- Do not use `vw` for font sizes; do not use negative letter-spacing
- All API calls go through `client/src/utils/api.ts::apiFetch` (attaches the
  Clerk JWT and `X-Timezone`, converts 402/429 to typed errors) — use it
  rather than raw `fetch`.

---

## Backend Conventions

- Backend is Express 5 + **TypeScript** (ESM, `.js` extensions on relative
  imports), not vanilla JS — `index.js` no longer exists.
- API keys are **SHA-256**-hashed (not MD5), stored in Postgres via Drizzle.
- Layering is strict: `routes/` → `controllers/` → `services/` → `models/` →
  `config/database.ts`. Controllers never touch `db` directly.
- The Python compute layer (`opsmcp/`) is **already built and wired in** —
  this is not future/speculative scope. Express remains the single source of
  truth for auth, quotas, and billing; opsmcp never duplicates that logic,
  it calls back into `POST /internal/validate-key` to check and meter every
  MCP tool call.
- A real, previously-shipped bug worth knowing about: subpath imports into a
  CJS package from ESM TypeScript need an explicit `.js` extension
  (`razorpay/dist/utils/razorpay-utils.js`, not the extensionless form) — the
  extensionless form works under `tsx watch` (lenient loader) but throws
  `ERR_MODULE_NOT_FOUND` under plain `node dist/index.js`, i.e. exactly the
  command production runs. If `tsc --noEmit` is clean but you haven't run
  `npm run build && npm start` (or built the Docker image), you have not
  verified the production path.
- Razorpay payment integration is active (test mode). Use test card
  `5267 3181 8797 5449` for development.

---

## Skills Reference

| Skill | When to invoke |
|-------|---------------|
| `frontend-god` | Any UI, web page, component, landing page, dashboard, or visual experience |
| `context7-mcp` | When asked about a library/framework API, setup, configuration, or version migration |
| `code-structure` | When multiple workflows duplicate logic, or when adding features that share mechanics with existing ones |
| `graphify` | When asked about codebase architecture, file relationships, or project structure |
| `code-structure-cleanup` | After a feature works but code has duplicated mechanics or messy structure |
| `review-pr` | When fixing review feedback on a PR or feature until tests pass |

**Always use `frontend-god` for any frontend work.** Load it proactively — do not wait for the user to ask.

**Always use `context7-mcp` for library/framework questions.** Never guess API behavior; fetch current docs.

---

## Decision Checklist

Before writing code, confirm:

1. Have I read `operations-mcp.md` for product context?
2. Does this change require touching the backend? If yes, is it necessary or should I ask first?
3. Am I following the 4 coding principles above?
4. If building UI, have I consulted `api-platform/DESIGN_SYSTEM.md`?
5. Is this the minimum code that solves the problem?
6. Can I verify the outcome with a concrete check (test, screenshot, curl, running the production build — not just the dev server)?

---

## Important Constraints

- **No backend or frontend tests.** `npx tsc --noEmit` and `npm run lint` are
  the only automated checks; a change isn't verified until you've also run
  it (curl against a running server, or the actual built app in a browser).
- **The Python compute layer is not future scope — it's live.** Do not
  duplicate its solver logic into Express, and do not duplicate Express's
  auth/quota/billing logic into Python.
- **Design-md files are static reference material and don't exist in this
  checkout.** Use `api-platform/DESIGN_SYSTEM.md`.

### Authentication & Payments
- Clerk handles all authentication (signup, login, sessions, JWTs). Do not implement custom auth.
- `clerkMiddleware()` must stay scoped to the routes that actually read
  `req.auth` (currently `/v1/keys` and `/v1/*` subscriptions) — mounting it
  globally previously took down `/health` and webhooks whenever the Clerk
  env config was invalid, since it does synchronous key validation on every
  request it wraps.
- Razorpay test keys used in development (`rzp_test_...`).
- 1 free API key per user (auto-created on Clerk `user.created` webhook,
  signature-verified via svix).
- Free key: 2 requests/day, resets at user's local midnight (via `X-Timezone` header).
- Additional keys require active Razorpay subscription.
- Webhook endpoints: `POST /v1/webhooks/clerk`, `POST /v1/webhooks/razorpay`
  — both must be mounted ahead of any `requireUserId`-guarded router, since
  Express runs a `use('/v1', ...)` mount's middleware for any path starting
  with `/v1`, including `/v1/webhooks/*`.
- Postgres (via Supabase in practice) is the persistent store. Never use
  in-memory storage for user data.
