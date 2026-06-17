import { createHash, randomBytes } from 'crypto';
import { getApiKeyByHash } from '../models/apiKeyModel.js';
const KEY_PREFIX = 'opsmcp-';
const KEY_BYTES = 32; // 256 bits -> 64 hex chars after prefix
export function hashApiKey(apiKey) {
    return createHash('sha256').update(apiKey).digest('hex');
}
export function generateApiKey() {
    const randomPart = randomBytes(KEY_BYTES).toString('hex');
    const apiKey = `${KEY_PREFIX}${randomPart}`;
    const hashedAPIKey = hashApiKey(apiKey);
    const mask = `${KEY_PREFIX}...${randomPart.slice(-4)}`;
    return { apiKey, hashedAPIKey, mask };
}
export async function validateApiKey(rawKey) {
    if (!rawKey)
        return null;
    const hashedAPIKey = hashApiKey(rawKey);
    const keyRecord = await getApiKeyByHash(hashedAPIKey);
    return keyRecord || null;
}
//# sourceMappingURL=apiKeyService.js.map