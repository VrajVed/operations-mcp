import { validateApiKey } from '../services/apiKeyService.js';
export async function validateApiKeyMiddleware(req, res, next) {
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
//# sourceMappingURL=apiKeyAuth.js.map