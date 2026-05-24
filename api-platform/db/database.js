const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', DB_PATH);
});

function initSchema() {
  db.serialize(() => {
    // Users table (synced from Clerk)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        clerk_id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        subscription_status TEXT DEFAULT 'inactive' CHECK(subscription_status IN ('inactive', 'active', 'past_due', 'cancelled')),
        razorpay_subscription_id TEXT,
        timezone TEXT DEFAULT 'UTC',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API Keys table
    db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        hashed_key TEXT NOT NULL UNIQUE,
        mask TEXT NOT NULL,
        is_free INTEGER DEFAULT 0 CHECK(is_free IN (0, 1)),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'revoked')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Key usage tracking table
    db.run(`
      CREATE TABLE IF NOT EXISTS key_usage (
        key_id TEXT PRIMARY KEY REFERENCES api_keys(id) ON DELETE CASCADE,
        daily_count INTEGER DEFAULT 0,
        daily_limit INTEGER DEFAULT 2,
        last_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_requests INTEGER DEFAULT 0
      )
    `);

    // Subscriptions table
    db.run(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
        razorpay_plan_id TEXT NOT NULL,
        status TEXT DEFAULT 'created' CHECK(status IN ('created', 'active', 'halted', 'cancelled', 'completed')),
        current_period_start INTEGER,
        current_period_end INTEGER,
        short_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Razorpay plans table (seeded on startup)
    db.run(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        currency TEXT DEFAULT 'INR',
        interval TEXT DEFAULT 'monthly',
        description TEXT
      )
    `);

    // Request logs table (for usage analytics)
    db.run(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER,
        latency_ms INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database schema initialized');
  });
}

function seedPlans() {
  const plans = [
    { id: 'plan_starter_monthly', name: 'Starter', price: 39900, currency: 'INR', interval: 'monthly', description: 'Unlimited keys and usage' },
    { id: 'plan_pro_monthly', name: 'Pro', price: 99900, currency: 'INR', interval: 'monthly', description: 'Priority support + unlimited access' },
    { id: 'plan_enterprise_monthly', name: 'Enterprise', price: 199900, currency: 'INR', interval: 'monthly', description: 'Dedicated infrastructure + SLA' }
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO plans (id, name, price, currency, interval, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  plans.forEach(plan => {
    stmt.run(plan.id, plan.name, plan.price, plan.currency, plan.interval, plan.description);
  });

  stmt.finalize();
  console.log('Plans seeded');
}

module.exports = { db, initSchema, seedPlans };
