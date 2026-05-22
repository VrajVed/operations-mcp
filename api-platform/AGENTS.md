# AGENTS.md — Operations MCP Platform

Compact instruction file for OpenCode sessions working in this repository.

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

**Operations MCP Platform** — An API-first infrastructure platform for optimization algorithms (Linear Programming, Simplex, etc.) exposed through MCP-compatible interfaces.

- **Current backend**: Express.js (`index.js`, port 8080) with hardcoded API key auth
- **Target backend**: Python / FastAPI / Pydantic / NumPy (future — do not implement without explicit approval)
- **Frontend target**: Dark-mode first, terminal-inspired, developer-centric, data-dense
- **Product spec source of truth**: `operations-mcp.md` (read before any product decisions)
- **Design reference library**: `design-md/` (70+ brand design systems with `DESIGN.md` specs)

The platform's ideal feel: *Stripe for optimization APIs, Vercel for computational tooling, OpenRouter for solver access.*

---

## Architecture

```
api-platform/
├── index.js                    # Current Express entrypoint (port 8080)
├── package.json                # Only dep: express ^5.2.1, no test/build scripts
├── operations-mcp.md           # Canonical product philosophy & spec
├── design-md/                  # Brand design system references (read for UI decisions)
│   ├── stripe/
│   ├── vercel/
│   ├── linear.app/
│   ├── raycast/
│   ├── warp/
│   ├── cursor/
│   ├── supabase/
│   └── ... (70+ brands)
└── node_modules/
```

- **Entrypoint**: `node index.js` → `http://localhost:8080`
- **Only active endpoint**: `GET /api?apiKey=...` — returns `{ message: 'Hello from the API!' }`
- No build system, no test runner, no linter, no CI configured.
- Backend is intentionally primitive right now; the philosophy doc defines the target stack.

---

## Developer Commands

```bash
# Start server
node index.js

# Install dependencies
npm install

# No tests, no lint, no build, no typecheck — everything is manual right now.
```

---

## Design System References

When building frontend or UI, consult `design-md/` for real brand systems. Most relevant for this project's vibe:

| Brand | Why it matters |
|-------|----------------|
| `linear.app/` | Deepest dark canvas (#010102), lavender accent — closest to target "technical minimal" feel |
| `stripe/` | API docs density, clean tables, financial-infrastructure credibility |
| `vercel/` | Developer-platform structure, Geist typography, infrastructure branding |
| `raycast/` | Dark developer-tool chrome, command-palette aesthetic, Inter + monospace |
| `warp/` | Warm charcoal terminal, understated CTAs, code-first presentation |
| `cursor/` | Warm cream editorial, monospace code surfaces, JetBrains Mono |
| `supabase/` | Emerald accent on near-monochrome, quiet technical branding |

Each subdirectory contains a `DESIGN.md` with full color tokens, typography scales, and component specs. `README.md` files usually redirect to getdesign.md — ignore those; read `DESIGN.md` directly.

---

## Frontend Conventions

When building the frontend (refer to `frontend-god` skill):
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

---

## Backend Conventions

- Current backend is Express + vanilla JS. Keep changes minimal.
- **Do not migrate to Python/FastAPI without explicit user approval** — this is documented future scope in `operations-mcp.md`.
- API keys are MD5-hashed in-memory (current implementation); this is prototype-level security.
- Razorpay payment integration is explicitly marked as **future scope** — do not implement.

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
4. If building UI, have I consulted at least 2 relevant `design-md/` files for reference?
5. Is this the minimum code that solves the problem?
6. Can I verify the outcome with a concrete check (test, screenshot, curl, etc.)?

---

## Important Constraints

- **No build toolchain exists yet.** Everything is manual. Don't assume webpack, vite, jest, etc. are configured.
- **No tests configured.** `npm test` exits with an error by design.
- **Payment integration (Razorpay) is future scope.** Do not implement.
- **Python/FastAPI backend migration is future scope.** Do not implement.
- **Design-md files are static reference material.** They are not maintained by this repo; treat them as read-only inspiration.
