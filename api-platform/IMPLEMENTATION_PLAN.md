# Implementation Plan — Operations MCP Platform

Last updated: 2026-05-24
Status: Ready for implementation

---

## 1. Overview

This document describes the complete implementation of authentication, API key management, and Razorpay subscription billing for the Operations MCP Platform.

**Core principle:** No key is allocated automatically except the free key on signup. Every additional key requires an active subscription.

---

## 2. Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Backend   │────▶│   Razorpay      │
│  (Clerk SDK)    │     │  (Port 8080)       │     │   (Test Mode)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                         │
        │    Clerk JWT            │    Webhooks
        │────────────────────────▶│◀─────────────────│
        │    X-Timezone header    │    subscription.*
        │                         │
        │◀────────────────────────│
        │    Keys, Usage, Plans   │
        │    402 → checkoutUrl    │
```

---

## 3. Authentication: Clerk

### Why Clerk?
- Handles signup, login, password reset, email verification, sessions, JWTs
- Drop-in React components (`<SignUp />`, `<SignIn />`, `<UserButton />`)
- Webhook support for `user.created` event
- No `bcryptjs`, no `jsonwebtoken`, no custom auth logic

### Backend Integration
```javascript
import { clerkMiddleware, requireAuth } from '@clerk/express';

app.use(clerkMiddleware());
app.use('/v1/keys', requireAuth(), keysRouter);
```

### Frontend Integration
```tsx
import { ClerkProvider, SignUp, SignIn, UserButton, useAuth } from '@clerk/clerk-react';

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

### Clerk Webhook
```
POST /v1/webhooks/clerk
  Event: user.created
  Action: Create free API key for new user
```

---

## 4. Pricing Tiers

| Plan | USD | INR | Paise | Features |
|------|-----|-----|-------|----------|
| **Free** | $0 | ₹0 | 0 | 1 key, 2 requests/day |
| **Starter** | **$4.99** | **₹399** | 39900 | Unlimited keys, unlimited usage |
| **Pro** | **$9.99** | **₹999** | 99900 | Unlimited keys, priority support |
| **Enterprise** | **$19.99** | **₹1,999** | 199900 | Dedicated infra, SLA, custom support |

### Razorpay Plans (created manually in Dashboard)
- `plan_starter_monthly` → 39900 paise
- `plan_pro_monthly` → 99900 paise
- `plan_enterprise_monthly` → 199900 paise

---

## 5. API Contract

### 5.1 Authentication (Handled by Clerk — no custom routes)

| Route | Component | Description |
|-------|-----------|-------------|
| `/signup` | `<SignUp />` | Clerk-hosted signup page |
| `/login` | `<SignIn />` | Clerk-hosted login page |
| `/logout` | `<UserButton />` | Clerk handles logout |

**Backend webhook:**
```
POST /v1/webhooks/clerk
  Headers: svix-id, svix-timestamp, svix-signature
  Body: { type: "user.created", data: { id, email_addresses } }
  Response: { received: true }
  Action: Create free API key for user
```

### 5.2 Keys

```
POST /v1/keys
  Headers:
    Authorization: Bearer <clerk_jwt>
    X-Timezone: Asia/Kolkata          // Client's timezone (e.g., Intl.DateTimeFormat().resolvedOptions().timeZone)
  Body: { name: "Production Key" }
  
  Response (200 - has active subscription):
    { 
      id: "key_abc123",
      name: "Production Key",
      key: "sk_live_xxxxxxxxxxxxxxxx",     // Raw key shown ONLY once
      mask: "sk_live_...xxxx",
      createdAt: "2026-05-24T00:00:00Z"
    }
  
  Response (402 - no active subscription):
    {
      error: "Subscription required",
      checkoutUrl: "https://rzp.io/i/...",
      plans: [
        { id: "plan_starter_monthly", name: "Starter", price: 39900, currency: "INR" },
        { id: "plan_pro_monthly", name: "Pro", price: 99900, currency: "INR" },
        { id: "plan_enterprise_monthly", name: "Enterprise", price: 199900, currency: "INR" }
      ]
    }

GET /v1/keys
  Headers: Authorization: Bearer <clerk_jwt>
  Response: [
    {
      id: "key_abc123",
      name: "Free Key",
      mask: "sk_live_...xxxx",
      status: "active",
      isFree: true,
      dailyCount: 1,
      dailyLimit: 2,
      lastReset: "2026-05-24T00:00:00Z",
      createdAt: "2026-05-24T00:00:00Z"
    }
  ]
  // Never returns raw key values

DELETE /v1/keys/:id
  Headers: Authorization: Bearer <clerk_jwt>
  Response: { status: "revoked" }
```

### 5.3 Subscriptions

```
GET /v1/plans
  Response: [
    { id: "plan_starter_monthly", name: "Starter", price: 39900, currency: "INR", interval: "monthly" },
    { id: "plan_pro_monthly", name: "Pro", price: 99900, currency: "INR", interval: "monthly" },
    { id: "plan_enterprise_monthly", name: "Enterprise", price: 199900, currency: "INR", interval: "monthly" }
  ]

POST /v1/subscriptions
  Headers: Authorization: Bearer <clerk_jwt>
  Body: { planId: "plan_starter_monthly" }
  Response: { subscriptionId: "sub_xxx", checkoutUrl: "https://rzp.io/i/..." }

GET /v1/subscriptions/status
  Headers: Authorization: Bearer <clerk_jwt>
  Response: { status: "active", plan: "Pro", currentPeriodEnd: "2026-06-24T00:00:00Z" }

POST /v1/webhooks/razorpay
  Headers: x-razorpay-signature
  Body: { event: "subscription.activated", payload: { subscription: { id, status } } }
  Response: { received: true }
```

### 5.4 Solver API (Existing Endpoint, Enhanced)

```
GET /api?apiKey=sk_live_xxxxxxxx
  Headers: X-Timezone: Asia/Kolkata
  
  Response (200):
    { message: "Hello from the API!" }
  
  Response (400):
    { error: "API key is required" }
  
  Response (401):
    { error: "Invalid API key" }
  
  Response (403):
    { error: "API key is inactive" }
  
  Response (429 - free key limit reached):
    {
      error: "Daily limit reached (2/2). Subscribe for unlimited access.",
      subscribeUrl: "/pricing",
      resetsAt: "2026-05-25T00:00:00+05:30"
    }
```

---

## 6. Rate Limiting: Free Key

### Rules
- **Free key limit:** 2 requests per day
- **Reset time:** Midnight in the user's local timezone
- **Timezone source:** `X-Timezone` header (e.g., `Asia/Kolkata`, `America/New_York`)
- **Default timezone:** UTC if header missing

### Algorithm
```javascript
function checkRateLimit(keyId, timezone = 'UTC') {
  const usage = keyUsage[keyId];
  const now = new Date();
  
  // Calculate midnight in user's timezone
  const userMidnight = new Date(
    now.toLocaleDateString('en-US', { timeZone: timezone })
  );
  const lastReset = new Date(usage.lastReset);
  
  // If a new day has started in user's timezone, reset counter
  if (userMidnight > lastReset) {
    usage.dailyCount = 0;
    usage.lastReset = userMidnight.toISOString();
  }
  
  if (usage.dailyCount >= 2) {
    return { allowed: false, nextReset: getTomorrowMidnight(timezone) };
  }
  
  usage.dailyCount++;
  usage.totalRequests++;
  return { allowed: true };
}
```

---

## 7. Data Models (In-Memory)

### 7.1 Users (SQLite Table: `users`)
| Column | Type | Description |
|--------|------|-------------|
| `clerk_id` | TEXT PK | Clerk user ID |
| `email` | TEXT | User email |
| `subscription_status` | TEXT | `inactive` | `active` | `past_due` | `cancelled` |
| `razorpay_subscription_id` | TEXT | Reference to Razorpay subscription |
| `timezone` | TEXT | User's timezone (default: UTC) |
| `created_at` | DATETIME | Auto-generated |

### 7.2 API Keys (SQLite Table: `api_keys`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Key ID (e.g., `key_abc123`) |
| `user_id` | TEXT FK | References `users.clerk_id` |
| `name` | TEXT | Display name |
| `hashed_key` | TEXT | MD5 hash of raw key |
| `mask` | TEXT | Masked display (e.g., `sk_live_...xxxx`) |
| `is_free` | INTEGER | 1 = free key (rate limited), 0 = paid key |
| `status` | TEXT | `active` | `revoked` |
| `created_at` | DATETIME | Auto-generated |

### 7.3 Key Usage (SQLite Table: `key_usage`)
| Column | Type | Description |
|--------|------|-------------|
| `key_id` | TEXT PK FK | References `api_keys.id` |
| `daily_count` | INTEGER | Current day request count |
| `daily_limit` | INTEGER | 2 for free, 999999 for paid |
| `last_reset` | DATETIME | Last midnight reset timestamp |
| `total_requests` | INTEGER | Lifetime request count |

### 7.4 Subscriptions (SQLite Table: `subscriptions`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | Razorpay subscription ID |
| `user_id` | TEXT FK | References `users.clerk_id` |
| `razorpay_plan_id` | TEXT | Plan ID |
| `status` | TEXT | `created` | `active` | `halted` | `cancelled` | `completed` |
| `current_period_start` | INTEGER | Unix timestamp |
| `current_period_end` | INTEGER | Unix timestamp |
| `short_url` | TEXT | Razorpay checkout URL |
| `created_at` | DATETIME | Auto-generated |

---

## 8. Razorpay Integration (Test Mode)

### 8.1 Environment Variables
```bash
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Razorpay (Test Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxx

# App
PORT=8080
```

### 8.2 Subscription Creation Flow
```
User clicks "Subscribe" on /pricing
  → Frontend: POST /v1/subscriptions { planId: "plan_pro_monthly" }
    → Backend: razorpay.subscriptions.create({
        plan_id: "plan_pro_monthly",
        total_count: 12,
        customer_notify: true,
        notes: { userId: "usr_clerk_id_123" }
      })
    → Returns: { id: "sub_xxx", short_url: "https://rzp.io/i/...", status: "created" }
    → Backend stores subscription in memory
    → Returns to frontend: { subscriptionId, checkoutUrl }
  → Frontend redirects to Razorpay checkout
  → User completes payment
  → Razorpay sends webhook: subscription.activated
    → Backend: verify signature → update user.subscriptionStatus = "active"
  → User can now create unlimited keys
```

### 8.3 Test Card for Razorpay
- **Card Number:** 5267 3181 8797 5449
- **Expiry:** Any future date (e.g., 12/30)
- **CVV:** Any 3 digits (e.g., 123)
- **OTP:** 123456

### 8.4 Webhook Events Handled

| Event | Action |
|-------|--------|
| `subscription.activated` | Set `subscriptionStatus = 'active'` |
| `subscription.charged` | Update `currentPeriodEnd`, log payment |
| `subscription.halted` | Set `subscriptionStatus = 'past_due'`, block new key creation |
| `subscription.cancelled` | Set `subscriptionStatus = 'cancelled'`, allow existing keys until expiry |
| `subscription.completed` | Downgrade to free tier after period ends |

---

## 9. File Changes

### 9.1 Backend (`api-platform/`)

| File | Action |
|------|--------|
| `package.json` | Add: `razorpay`, `@clerk/express`, `dotenv`, `uuid` |
| `.env` | New: Clerk + Razorpay env vars |
| `index.js` | Complete rewrite: Clerk middleware, auth routes, key management, subscriptions, Razorpay webhooks, rate-limit middleware |
| `AGENTS.md` | Update: remove Razorpay as future scope, document Clerk + subscription model |

### 9.2 Frontend (`client/src/`)

| File | Action |
|------|--------|
| `package.json` | Add: `@clerk/clerk-react` |
| `main.tsx` | Wrap app in `<ClerkProvider>` |
| `App.tsx` | Add Clerk routes, remove ComingSoon placeholders |
| `pages/Signup.tsx` | Replace with `<SignUp />` component |
| `pages/Login.tsx` | Replace with `<SignIn />` component |
| `pages/Pricing.tsx` | New: 4-tier pricing cards with subscribe buttons |
| `pages/Dashboard.tsx` | Major update: real API data, key list, create key flow, subscription status, rate limit display |
| `components/Navbar.tsx` | Replace auth buttons with `<UserButton />`, add login/signup links |
| `utils/api.ts` | New: fetch wrapper with Clerk JWT + `X-Timezone` header, handles 402/429 |

---

## 10. Key Behaviors Summary

| Scenario | Behavior |
|----------|----------|
| New user signs up | 1 free key auto-created via Clerk webhook, shown once on dashboard |
| User calls `/api` with free key (1st time) | 200 OK, count = 1/2 |
| User calls `/api` with free key (2nd time) | 200 OK, count = 2/2 |
| User calls `/api` with free key (3rd time) | 429 Too Many Requests, message: "Daily limit reached (2/2)" |
| User tries `POST /v1/keys` (no subscription) | 402 Payment Required + Razorpay checkout URL + plan list |
| User subscribes via Razorpay | Webhook activates subscription, user can create unlimited keys |
| User revokes a key | Key status = 'revoked', no longer valid for `/api` |
| Subscription expires | User can still use existing keys, but cannot create new ones |
| Midnight in user's timezone | Free key daily count resets to 0 |

---

## 11. Verification Checklist

| # | Step | Verify |
|---|------|--------|
| 1 | Install deps | `npm install` succeeds, all packages present |
| 2 | Configure env | `.env` has all Clerk + Razorpay keys |
| 3 | Start server | `node index.js` → no errors, port 8080 |
| 4 | Signup via Clerk | `/signup` page loads, create account |
| 5 | Free key created | Dashboard shows 1 free key, raw key visible once |
| 6 | Test free key rate limit | Call `/api?apiKey=...` 2 times → success. 3rd time → 429 |
| 7 | Check reset | Wait for midnight (or mock timezone), verify count resets |
| 8 | Create extra key (no sub) | `POST /v1/keys` → 402 + checkoutUrl |
| 9 | Subscribe via Razorpay | Click checkoutUrl, pay with test card |
| 10 | Webhook received | Check server logs: subscription.activated handled |
| 11 | Create key (with sub) | `POST /v1/keys` → 200 with new key |
| 12 | Frontend pricing | `/pricing` shows 4 tiers with correct prices |
| 13 | Frontend dashboard | Shows keys, subscription status, usage count |
| 14 | Logout / login | Clerk session persists, dashboard loads correctly |

---

## 12. Notes

- **SQLite storage:** All data is persisted in `database.sqlite`. Data survives server restarts.
- **Clerk webhook endpoint:** Must be publicly accessible for Clerk to send `user.created` events. Use ngrok for local development.
- **Razorpay webhook endpoint:** Must be publicly accessible. Use ngrok for local development.
- **Security:** API keys are MD5-hashed for lookup (same as current). This is prototype-level security and should be upgraded to bcrypt or Argon2 before production.
- **Timezone handling:** The server relies on the client sending the correct timezone in `X-Timezone`. This is acceptable for a prototype but should be stored server-side per user in production.
