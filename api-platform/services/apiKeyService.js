const { createHash, randomBytes } = require('crypto');
const { getApiKeyByHash } = require('../db/queries');

function hashApiKey(apiKey) {
  return createHash('md5').update(apiKey).digest('hex');
}

function generateApiKey() {
  const apiKey = randomBytes(16).toString('hex');
  const hashedAPIKey = hashApiKey(apiKey);
  const mask = 'sk_live_...' + apiKey.slice(-4);
  return { apiKey, hashedAPIKey, mask };
}

async function validateApiKey(rawKey) {
  if (!rawKey) return null;
  const hashedAPIKey = hashApiKey(rawKey);
  const keyRecord = await getApiKeyByHash(hashedAPIKey);
  return keyRecord || null;
}

module.exports = { hashApiKey, generateApiKey, validateApiKey };
