import { validateApiKey } from '../services/apiKeyService.js';
import { checkAndIncrement } from '../services/rateLimitService.js';
import { logRequest } from '../models/index.js';
/**
 * Called by the Python MCP server (opsmcp) on every tool invocation. This is what
 * makes an API key generated on the platform meaningful inside an MCP client like
 * Claude Desktop or Cursor: the key travels with the tool call, gets validated and
 * quota-checked here exactly as the REST /api path does, and the call is logged
 * against the same key_usage / request_logs rows either path would touch.
 */
export async function validateKey(req, res) {
    const start = Date.now();
    const { apiKey, tool, timezone } = req.body;
    if (!apiKey) {
        return res.status(400).json({ valid: false, error: 'api_key_required' });
    }
    const keyRecord = await validateApiKey(apiKey);
    if (!keyRecord) {
        return res.status(401).json({ valid: false, error: 'invalid_key' });
    }
    if (keyRecord.status !== 'active') {
        return res.status(403).json({ valid: false, error: 'key_inactive' });
    }
    const result = await checkAndIncrement(keyRecord.id, timezone || 'UTC');
    if (!result.allowed) {
        await logRequest(keyRecord.id, tool || 'mcp:unknown', 'MCP', 429, Date.now() - start);
        return res.status(429).json({
            valid: false,
            error: 'quota_exceeded',
            dailyCount: result.dailyCount,
            dailyLimit: result.dailyLimit,
            resetsAt: result.resetsAt,
        });
    }
    await logRequest(keyRecord.id, tool || 'mcp:unknown', 'MCP', 200, Date.now() - start);
    return res.json({
        valid: true,
        keyId: keyRecord.id,
        userId: keyRecord.user_id,
        isFree: keyRecord.is_free,
        dailyCount: result.dailyCount,
        dailyLimit: result.dailyLimit,
    });
}
//# sourceMappingURL=internalController.js.map