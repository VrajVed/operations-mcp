import { generateApiKey } from '../services/apiKeyService.js';
import { createApiKey, getApiKeysByUser, revokeApiKey, countActiveKeysByUser, getUserByClerkId, getSubscriptionByUser, } from '../models/index.js';
export async function createKey(req, res) {
    try {
        const clerkId = req.auth.userId;
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Key name is required' });
        }
        const user = await getUserByClerkId(clerkId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const activeKeyCount = await countActiveKeysByUser(clerkId);
        if (activeKeyCount === 0) {
            const { apiKey, hashedAPIKey, mask } = generateApiKey();
            const key = await createApiKey(clerkId, name, hashedAPIKey, mask, true);
            return res.status(200).json({
                id: key.id,
                name: key.name,
                key: apiKey,
                mask: key.mask,
                createdAt: new Date().toISOString(),
            });
        }
        if (user.subscription_status !== 'active') {
            const subscription = await getSubscriptionByUser(clerkId);
            return res.status(402).json({
                error: 'Subscription required',
                message: 'Free key already used. Subscribe to create more API keys.',
                checkoutUrl: subscription ? subscription.short_url : null,
            });
        }
        const { apiKey, hashedAPIKey, mask } = generateApiKey();
        const key = await createApiKey(clerkId, name, hashedAPIKey, mask, false);
        return res.status(200).json({
            id: key.id,
            name: key.name,
            key: apiKey,
            mask: key.mask,
            createdAt: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('Create key error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
export async function listKeys(req, res) {
    try {
        const clerkId = req.auth.userId;
        const keys = await getApiKeysByUser(clerkId);
        res.json(keys.map((k) => ({
            id: k.id,
            name: k.name,
            mask: k.mask,
            status: k.status,
            isFree: !!k.is_free,
            dailyCount: k.daily_count,
            dailyLimit: k.daily_limit,
            lastReset: k.last_reset,
            createdAt: k.created_at,
        })));
    }
    catch (err) {
        console.error('List keys error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
export async function revokeKey(req, res) {
    try {
        const clerkId = req.auth.userId;
        const { id } = req.params;
        const result = await revokeApiKey(id, clerkId);
        if (!result.revoked) {
            return res.status(404).json({ error: 'Key not found' });
        }
        res.json({ status: 'revoked' });
    }
    catch (err) {
        console.error('Revoke key error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=keysController.js.map