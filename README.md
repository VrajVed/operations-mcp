# operations-python

A linear programming solver engine and API platform. The solvers live in
Python (exposed via MCP), the platform lives in TypeScript (Express +
Postgres), and a React frontend sits on top.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  operations-python                     │
│                                                       │
│  ┌─────────────────┐        ┌──────────────────────┐ │
│  │   Compute Layer  │  MCP   │    Platform Layer    │ │
│  │  (Python/MCP)    │◄──────►│  (Express + Clerk)   │ │
│  │                  │  SSE   │                      │ │
│  │  Primal Simplex  │ /stdio │  Auth (Clerk)        │ │
│  │  Dual Simplex    │        │  API Key Mgmt        │ │
│  │  Big-M           │        │  Rate Limiting       │ │
│  │  Smart Router    │        │  Billing (Razorpay)  │ │
│  └─────────────────┘        └──────────┬───────────┘ │
│                                        │              │
│                               ┌────────▼───────────┐ │
│                               │    PostgreSQL        │ │
│                               │  (Drizzle ORM)      │ │
│                               └────────────────────┘ │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │           Frontend (React + Tailwind)         │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## Status

**Solver engine — done.** Primal Simplex, Dual Simplex, Big-M, and a smart
router that picks between them. Tests passing. MCP servers (SSE + stdio)
work end-to-end.

**Platform — mostly wired.** Clerk auth, API key management (SHA-256 hashed),
rate limiting, Postgres/Drizzle persistence, and Razorpay billing are all live.

**Known gap:** the Express API's solve endpoint doesn't yet call the Python
solver layer — that bridge (`POST /v1/solve`) is the next piece of work.

## Getting Started

### Prerequisites

- Python 3.14+
- Node.js 20+
- PostgreSQL

### Compute Layer

```bash
cd opsmcp
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# SSE server (port 3001)
python server.py

# stdio server (for Claude Desktop)
python server_stdio.py
```

### Platform Layer

```bash
cd api-platform/backend
npm install
cp .env.example .env       # fill in your keys
npm run dev                # port 8080
```

### Frontend

```bash
cd api-platform/client
npm install
cp .env.example .env
npm run dev                # port 5173
```

## Project Structure

```
opsmcp/                          # Python compute layer
├── core/                        # Solver implementations
│   ├── tableau.py              # Primal simplex
│   ├── dual_simplex.py         # Dual simplex
│   ├── big_m.py                # Big-M method
│   └── pivot.py                # Shared pivot operation
├── models/                      # Pydantic schemas
├── tools/                       # MCP tool handlers + router
├── utils/                       # Formatting & display
├── tests/                       # 25 passing tests
└── server.py                    # SSE MCP server

api-platform/
├── backend/                     # Express.js API
│   └── src/
│       ├── middleware/          # Auth, rate limiting
│       ├── controllers/         # Route handlers
│       ├── services/            # Business logic
│       ├── models/              # Drizzle schema
│       └── routes/              # Route definitions
└── client/                      # React frontend
    └── src/
        ├── components/          # UI components
        ├── pages/               # Route pages
        └── lib/                 # Utilities
```

## Solvers

| Solver | Handles | Status |
|--------|---------|--------|
| Primal Simplex | max, `<=`, RHS ≥ 0 | Complete |
| Dual Simplex | min, `>=`, detects infeasibility | Complete |
| Big-M | General LPs (mixed constraints, =, min/max) | Complete |
| Smart Router | Selects solver based on problem structure | Complete |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Solvers | Python 3.14, Pydantic, MCP SDK |
| API | Express 5, TypeScript |
| Auth | Clerk |
| Database | PostgreSQL, Drizzle ORM |
| Billing | Razorpay |
| Frontend | React 19, Vite, Tailwind v4 |

## License

MIT
