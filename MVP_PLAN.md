# OpsMCP MVP Plan

## Vision

```
User
  ↓
OpsMCP Dashboard
  ↓
Gets API Key
  ↓
Puts API Key into Claude / Cursor / OpenCode
  ↓
MCP works
  ↓
Usage gets tracked
  ↓
Billing works
```

## Architecture

Three strictly separated layers:

| Layer | Technology | Owns |
|-------|-----------|------|
| **Platform** | Express.js + PostgreSQL | Users, Clerk auth, Razorpay billing, API keys, subscriptions, rate limits, analytics, dashboards |
| **Compute** | Python + Pydantic | Mathematical logic, schemas, parsers, tableaux, simplex, dual simplex, Big-M, transportation, assignment, future optimization algorithms |
| **MCP Transport** | Python MCP SDK | Exposes compute tools to Claude, Cursor, OpenCode, and any other AI provider |

**Rule**: Never duplicate auth, billing, or rate limiting across layers. Express is the single source of truth.

---

## Phase 1: Public MCP Server (Immediate Goal)

**Status**: No API key required. Open public access.

### Objective
Build a working MCP server that exposes the existing Python solvers to any AI client.

### Deliverables
1. `mcp/server.py` — FastAPI + MCP SDK server
   - Tool: `simplex_solve` → calls `solve_simplex()`
   - Tool: `dual_simplex_solve` → calls `solve_dual_simplex()`
   - Input: `SimplexProblem` JSON schema
   - Output: `{ status, solution, iterations, objective_value }`
2. `mcp/tests/test_mcp_server.py` — Verify tools are registered and callable
3. `mcp/run_mcp_server.py` — CLI entrypoint

### Success Criteria
- Claude Desktop can discover `simplex_solve` and `dual_simplex_solve`
- Tool call returns valid JSON with full iteration trace
- No auth layer yet — purely public

---

## Phase 2: Express REST API + Solver Integration

**Status**: Internal HTTP bridge. No public auth yet.

### Objective
Connect the Express placeholder endpoint to the Python solver engine.

### Deliverables
1. Replace `GET /api` (placeholder) with `POST /v1/solve`
   - Accepts JSON body: `{ tool, input }`
   - Internally calls Python solver via HTTP `POST` to `localhost:3001`
   - Returns solver result
2. Add request logging to `request_logs` table in Express
3. Python solver exposes internal REST endpoints (not MCP):
   - `POST /solve/simplex`
   - `POST /solve/dual_simplex`

### Success Criteria
- `curl -X POST http://localhost:8080/v1/solve` with a valid LP problem returns the optimal solution
- Request appears in `request_logs` table
- MCP server still works independently on port 3001

---

## Phase 3: Authentication + API Keys

**Status**: Auth layer introduced. Free tier active.

### Objective
Require API keys for all solver access. Free tier limited to 2 requests/day.

### Deliverables
1. Express:
   - Add `POST /internal/validate-key` endpoint
   - Returns: `{ valid, user_id, plan, remaining }`
   - Checks: active key, subscription status, quota available, increments usage
2. Python MCP server:
   - Add middleware: `validate_api_key(api_key)`
   - Calls `POST /internal/validate-key` on Express
   - Rejects tool call if invalid or quota exceeded
3. Python REST server (for Express proxy):
   - Also validates API key before solving
4. Update `POST /v1/solve` in Express:
   - Validate API key natively (already implemented in `apiKeyAuth.ts`)
   - Forward to Python only if valid

### Success Criteria
- MCP tool call without API key returns `401 Unauthorized`
- MCP tool call with valid free-tier key works (2x/day)
- Third call on free tier returns `429 Daily limit reached`
- Express `/v1/solve` enforces same rules

---

## Phase 4: Dashboard + Billing

**Status**: Full platform. Paid plans active.

### Objective
Complete the vision loop: user signs up, gets key, pays, and uses MCP.

### Deliverables
1. Frontend dashboard (`api-platform/client/`)
   - Landing page with solver playground
   - Auth via Clerk (sign up / log in)
   - API key management (create, list, revoke)
   - Usage analytics (requests, limits, history)
   - Subscription plans and checkout
2. Express backend:
   - Clerk webhook: `user.created` → auto-create free key
   - Razorpay webhook: update subscription status
   - `GET /v1/plans` — list subscription tiers
   - `POST /v1/subscriptions` — create Razorpay subscription
   - `GET /v1/subscriptions/status` — check active plan
3. Python layer:
   - No changes — remains pure compute

### Success Criteria
- User can sign up on dashboard and immediately receive a free API key
- User can upgrade to paid plan via Razorpay
- Paid plan removes rate limits
- MCP server respects plan tier when validating keys

---

## Request Flow (Phase 3+)

### MCP Flow (Claude / Cursor → Python MCP Server)
```
Claude Desktop
  → calls tool simplex_solve
    → Python MCP Server (port 3001)
      → validate_api_key(api_key)
        → POST /internal/validate-key (Express, port 8080)
          → check active, subscription, quota, increment
        ← { valid: true, remaining: 142 }
      → run solve_dual_simplex(problem)
      ← return result
    ← return result
  ← display to user
```

### REST Flow (Dashboard / Public API → Express)
```
Client
  → POST /v1/solve
    → Express (port 8080)
      → validateApiKeyMiddleware (checks key, rate limit)
      → POST /solve/dual_simplex (Python, port 3001)
        → run solver
      ← return result
    ← log request
  ← return result
```

---

## Technical Stack

| Component | Technology | Port |
|-----------|-----------|------|
| Express platform | Node.js + TypeScript + Express | 8080 |
| PostgreSQL database | Postgres + Drizzle ORM | 5432 |
| Python compute | Python 3.14 + Pydantic | — |
| MCP server | Python MCP SDK + FastAPI | 3001 |
| Frontend dashboard | Vite + TypeScript + Tailwind | 5173 |

---

## Current State vs. MVP

All four phases are built and verified end-to-end (real containers, real
Postgres, real MCP client) — see `context.md` for how each was checked.

| Component | Current |
|-----------|---------|
| `opsmcp/core/` solvers | ✅ Ready |
| `opsmcp/models/` schemas | ✅ Ready |
| `opsmcp/server.py` (SSE MCP + REST bridge) | ✅ Built, key-validated |
| `opsmcp/server_stdio.py` | ✅ Built, key-validated |
| Express `/api` (legacy) | ⚠️ Kept as a stub for backward compat only |
| Express `POST /v1/solve` | ✅ Validates key + quota, forwards to opsmcp |
| Express auth system | ✅ Complete |
| Express rate limiting | ✅ Complete, shared between MCP and REST paths |
| Express billing | ✅ Complete |
| `POST /internal/validate-key` | ✅ Shared-secret guarded, used by opsmcp |
| Dashboard wired to real endpoints | ✅ Complete |
| Dockerized (dev + prod compose) | ✅ Complete — see `DEPLOYMENT.md` |

---

## Open Questions

1. **Python MCP server transport**: Should it use stdio (for local CLI) or SSE (for remote)?
   - Recommendation: SSE for Phase 1 (remote testing), stdio later for local distribution.
2. **Usage increment timing**: Should Express increment on validation, or should Python call a separate "commit usage" endpoint after a successful solve?
   - Recommendation: Increment on validation for simplicity. Revisit if overcounting becomes a problem.
3. **Internal endpoint security**: `POST /internal/validate-key` must be bound to `localhost` only.
   - Resolved differently than the original recommendation: backend and opsmcp
     run as separate containers, so IP-binding to `127.0.0.1` doesn't apply
     across the compose network. Guarded instead by a shared secret
     (`X-Internal-Secret`, checked in `middleware/internalAuth.ts`) and by
     never reverse-proxying `/internal/*` through the public-facing Caddy
     (see the root `Caddyfile` and `DEPLOYMENT.md`).

---

All four phases described above are built and verified — see `context.md`
for what was actually checked and how.