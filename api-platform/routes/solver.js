const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../services/apiKeyService');
const { checkAndIncrement } = require('../services/rateLimitService');
const { getUserByClerkId, updateUserTimezone } = require('../db/queries');

// Middleware to validate API key and attach key record
async function validateApiKeyMiddleware(req, res, next) {
  const rawKey = req.query.apiKey || req.headers['x-api-key'];

  if (!rawKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const keyRecord = await validateApiKey(rawKey);
  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (keyRecord.status !== 'active') {
    return res.status(403).json({ error: 'API key is inactive' });
  }

  req.keyRecord = keyRecord;
  next();
}

// GET /api - Main solver endpoint
router.get('/api', validateApiKeyMiddleware, async (req, res) => {
  const keyRecord = req.keyRecord;
  const timezone = req.headers['x-timezone'] || 'UTC';

  // Rate limiting is only enforced for free keys
  if (keyRecord.is_free) {
    const result = await checkAndIncrement(keyRecord.id, timezone);
    if (!result.allowed) {
      return res.status(429).json({
        error: `Daily limit reached (${result.dailyCount}/${result.dailyLimit}). Subscribe for unlimited access.`,
        subscribeUrl: '/pricing',
        resetsAt: result.resetsAt,
      });
    }
  }

  // Update timezone for user tracking (fire and forget)
  getUserByClerkId(keyRecord.user_id).then(user => {
    if (user && user.timezone !== timezone) {
      updateUserTimezone(keyRecord.user_id, timezone);
    }
  }).catch(() => {});

  res.json({ message: 'Hello from the API!' });
});

module.exports = router;
