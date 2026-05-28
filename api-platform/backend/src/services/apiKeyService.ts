import { createHash, randomBytes } from 'crypto';
import { getApiKeyByHash } from '../models/apiKeyModel.js';

export function hashApiKey(apiKey: string) {
  return createHash('md5').update(apiKey).digest('hex');
}

export function generateApiKey() {
  const apiKey = randomBytes(16).toString('hex');
  const hashedAPIKey = hashApiKey(apiKey);
  const mask = 'sk_live_...' + apiKey.slice(-4);
  return { apiKey, hashedAPIKey, mask };
}

export async function validateApiKey(rawKey: string) {
  if (!rawKey) return null;
  const hashedAPIKey = hashApiKey(rawKey);
  const keyRecord = await getApiKeyByHash(hashedAPIKey);
  return keyRecord || null;
}
