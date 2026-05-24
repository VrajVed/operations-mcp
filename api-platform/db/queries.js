const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

// ===================== USERS =====================

function createUser(clerkId, email) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (clerk_id, email) VALUES (?, ?)',
      [clerkId, email],
      function (err) {
        if (err) return reject(err);
        resolve({ clerk_id: clerkId, email });
      }
    );
  });
}

function getUserByClerkId(clerkId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE clerk_id = ?', [clerkId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function updateUserSubscription(clerkId, status, razorpaySubId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET subscription_status = ?, razorpay_subscription_id = ? WHERE clerk_id = ?',
      [status, razorpaySubId, clerkId],
      function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes > 0 });
      }
    );
  });
}

function updateUserTimezone(clerkId, timezone) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET timezone = ? WHERE clerk_id = ?',
      [timezone, clerkId],
      function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes > 0 });
      }
    );
  });
}

// ===================== API KEYS =====================

function createApiKey(userId, name, hashedKey, mask, isFree = false) {
  const id = 'key_' + uuidv4().replace(/-/g, '').slice(0, 12);
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO api_keys (id, user_id, name, hashed_key, mask, is_free) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, name, hashedKey, mask, isFree ? 1 : 0],
      function (err) {
        if (err) return reject(err);
        // Initialize usage tracking
        db.run(
          'INSERT INTO key_usage (key_id, daily_limit) VALUES (?, ?)',
          [id, isFree ? 2 : 999999],
          (err2) => {
            if (err2) return reject(err2);
            resolve({ id, userId, name, mask, isFree });
          }
        );
      }
    );
  });
}

function getApiKeyByHash(hashedKey) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM api_keys WHERE hashed_key = ?', [hashedKey], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function getApiKeysByUser(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT k.*, u.daily_count, u.daily_limit, u.last_reset
       FROM api_keys k
       LEFT JOIN key_usage u ON k.id = u.key_id
       WHERE k.user_id = ? AND k.status = 'active'`,
      [userId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function revokeApiKey(keyId, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE api_keys SET status = 'revoked' WHERE id = ? AND user_id = ?",
      [keyId, userId],
      function (err) {
        if (err) return reject(err);
        resolve({ revoked: this.changes > 0 });
      }
    );
  });
}

function countActiveKeysByUser(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND status = 'active'",
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row.count);
      }
    );
  });
}

// ===================== KEY USAGE =====================

function getKeyUsage(keyId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM key_usage WHERE key_id = ?', [keyId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function incrementKeyUsage(keyId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE key_usage SET daily_count = daily_count + 1, total_requests = total_requests + 1 WHERE key_id = ?',
      [keyId],
      function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes > 0 });
      }
    );
  });
}

function resetKeyUsage(keyId) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE key_usage SET daily_count = 0, last_reset = CURRENT_TIMESTAMP WHERE key_id = ?",
      [keyId],
      function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes > 0 });
      }
    );
  });
}

// ===================== SUBSCRIPTIONS =====================

function createSubscription(id, userId, razorpayPlanId, shortUrl) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO subscriptions (id, user_id, razorpay_plan_id, short_url) VALUES (?, ?, ?, ?)',
      [id, userId, razorpayPlanId, shortUrl],
      function (err) {
        if (err) return reject(err);
        resolve({ id, userId, razorpayPlanId, shortUrl });
      }
    );
  });
}

function updateSubscriptionStatus(id, status, currentPeriodStart, currentPeriodEnd) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ? WHERE id = ?',
      [status, currentPeriodStart, currentPeriodEnd, id],
      function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes > 0 });
      }
    );
  });
}

function getSubscriptionByUser(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

// ===================== PLANS =====================

function getAllPlans() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM plans ORDER BY price ASC', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getPlanById(planId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM plans WHERE id = ?', [planId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// ===================== REQUEST LOGS =====================

function logRequest(keyId, endpoint, method, statusCode, latencyMs) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO request_logs (key_id, endpoint, method, status_code, latency_ms) VALUES (?, ?, ?, ?, ?)',
      [keyId, endpoint, method, statusCode, latencyMs],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function getRequestLogsByUser(userId, limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.* FROM request_logs r
       JOIN api_keys k ON r.key_id = k.id
       WHERE k.user_id = ?
       ORDER BY r.timestamp DESC
       LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

module.exports = {
  createUser,
  getUserByClerkId,
  updateUserSubscription,
  updateUserTimezone,
  createApiKey,
  getApiKeyByHash,
  getApiKeysByUser,
  revokeApiKey,
  countActiveKeysByUser,
  getKeyUsage,
  incrementKeyUsage,
  resetKeyUsage,
  createSubscription,
  updateSubscriptionStatus,
  getSubscriptionByUser,
  getAllPlans,
  getPlanById,
  logRequest,
  getRequestLogsByUser,
};
