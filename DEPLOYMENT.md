# Deployment runbook

Deploys the full stack (backend, opsmcp, client, Caddy) to a single small box
with `docker-compose.prod.yml`. No managed database, no load balancer, no NAT
gateway — production uses the existing Supabase project for Postgres (see
[context.md](context.md) for why), and Caddy on the box handles TLS directly.
Target cost: $0–5/month.

I can't run interactive AWS CLI login myself, so the box provisioning and the
final `docker compose up` are yours to run. Everything below is copy-pasteable.

## 1. Pick where the box runs

| Option | Cost | Notes |
|---|---|---|
| **AWS EC2 free tier** (`t2.micro`/`t3.micro`) | $0/mo for 12 months, then ~$8/mo | Watch for an Elastic IP left **unattached** — those bill hourly even when idle. Attach it to the running instance and leave it there. |
| **AWS Lightsail** | $3.50–5/mo flat | Simpler: bundles a static IP, firewall, and predictable billing into one product. No free-tier clock. |

Either way: **do not** add a NAT Gateway (~$32/mo), an Application Load
Balancer (~$16/mo), or RDS (~$15+/mo) — none of them are needed here. One box
with a public IP is the whole architecture.

Use Ubuntu 24.04 LTS. Open inbound ports 22 (SSH, ideally restricted to your
IP), 80, and 443 in the security group / Lightsail firewall.

## 2. Point DNS at the box

Create an A record for the domain (or subdomain) you'll use, pointing at the
box's public IP. Caddy needs this resolvable **before** it can issue a TLS
certificate via Let's Encrypt's HTTP-01 challenge — do this first, DNS
propagation can take a few minutes.

## 3. Install Docker on the box

```bash
ssh ubuntu@<box-ip>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker compose version   # confirm the compose plugin is present
```

## 4. Get the code onto the box

```bash
git clone <your-repo-url> operations-python
cd operations-python
```

## 5. Configure secrets

Two env files, neither committed to git:

```bash
cp .env.prod.example .env
cp api-platform/backend/.env.production.example api-platform/backend/.env.production
```

Edit `.env` (repo root — consumed by `docker-compose.prod.yml` for variable
substitution):
- `DOMAIN` — the domain from step 2.
- `INTERNAL_API_SECRET` — `openssl rand -hex 32`. Must match nowhere else;
  compose injects it into both `backend` and `opsmcp` from this one value.
- `VITE_API_URL` — `https://<DOMAIN>` (Caddy proxies `/v1`, `/api`, `/health`
  there — see the root `Caddyfile`).
- `VITE_CLERK_PUBLISHABLE_KEY` — from the Clerk dashboard.

Edit `api-platform/backend/.env.production`:
- `DATABASE_URL` — the Supabase pooler connection string (Settings → Database
  → Connection pooling in the Supabase dashboard). This is the same Supabase
  project used for local dev, per the project's database decision — do not
  point this at a container.
- `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` — from Clerk.
- `AUTHORIZED_PARTIES` — `https://<DOMAIN>`.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — from
  Razorpay.

## 6. Push the schema (one time, or after a schema change)

Drizzle needs a direct connection to Supabase for `db:push`. Run this from
your own machine (or the box) with the same `DATABASE_URL`, **never** against
the local disposable Postgres:

```bash
cd api-platform/backend
DATABASE_URL="<the Supabase connection string>" npx drizzle-kit push
```

## 7. Bring the stack up

```bash
cd operations-python
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f caddy   # watch cert issuance
```

Caddy logs should show a successful ACME certificate issuance for `$DOMAIN`
within a few seconds if DNS is already resolving.

## 8. Verify

```bash
curl https://<DOMAIN>/health          # backend health, via Caddy
curl https://<DOMAIN>/               # client SPA
```

Then, from the dashboard: create a real API key, and either call
`POST https://<DOMAIN>/v1/solve` with it, or point an MCP client's SSE
transport at `https://<DOMAIN>/sse?apiKey=<key>`. Confirm usage shows up
against the key afterward — this exercises the same path verified locally
against `docker-compose.yml` before shipping this runbook.

## 9. Point external webhooks at the new domain

- Clerk dashboard → Webhooks → endpoint URL: `https://<DOMAIN>/v1/webhooks/clerk`
- Razorpay dashboard → Webhooks → endpoint URL: `https://<DOMAIN>/v1/webhooks/razorpay`

## Operating it afterward

**Deploy a change:**
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**Logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f opsmcp
```

**Restart one service:**
```bash
docker compose -f docker-compose.prod.yml restart backend
```

**Database backups:** handled by Supabase, not this box — there's no local
Postgres volume to back up in production.

## What's deliberately not exposed publicly

The root `Caddyfile` only proxies `/sse`, `/messages/*`, `/v1/*`, `/api`, and
`/health`. It does not route `/internal/*` — that's the backend↔opsmcp
service-to-service path (shared-secret guarded, see
`api-platform/backend/src/middleware/internalAuth.ts`) and must stay reachable
only over the compose network, never the public internet. If you edit the
Caddyfile, keep it that way.
