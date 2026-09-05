import { eq, and, count } from 'drizzle-orm';
import { db } from '../config/database.js';
import { apiKeys, keyUsage } from '../config/schema.js';
import { v4 as uuidv4 } from 'uuid';
export async function createApiKey(userId, name, hashedKey, mask, isFree = false) {
    const id = 'key_' + uuidv4().replace(/-/g, '').slice(0, 12);
    await db.transaction(async (tx) => {
        await tx.insert(apiKeys).values({
            id,
            user_id: userId,
            name,
            hashed_key: hashedKey,
            mask,
            is_free: isFree,
            status: 'active',
        });
        await tx.insert(keyUsage).values({
            key_id: id,
            daily_limit: isFree ? 2 : 999999,
        });
    });
    return { id, userId, name, mask, isFree };
}
export async function getApiKeyByHash(hashedKey) {
    const result = await db.select().from(apiKeys).where(eq(apiKeys.hashed_key, hashedKey));
    return result[0] ?? null;
}
export async function getApiKeysByUser(userId) {
    return db.select({
        id: apiKeys.id,
        user_id: apiKeys.user_id,
        name: apiKeys.name,
        hashed_key: apiKeys.hashed_key,
        mask: apiKeys.mask,
        is_free: apiKeys.is_free,
        status: apiKeys.status,
        created_at: apiKeys.created_at,
        daily_count: keyUsage.daily_count,
        daily_limit: keyUsage.daily_limit,
        last_reset: keyUsage.last_reset,
    })
        .from(apiKeys)
        .leftJoin(keyUsage, eq(apiKeys.id, keyUsage.key_id))
        .where(and(eq(apiKeys.user_id, userId), eq(apiKeys.status, 'active')));
}
export async function revokeApiKey(keyId, userId) {
    const result = await db.update(apiKeys)
        .set({ status: 'revoked' })
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.user_id, userId)))
        .returning();
    return { revoked: result.length > 0 };
}
export async function countActiveKeysByUser(userId) {
    const result = await db.select({ count: count() })
        .from(apiKeys)
        .where(and(eq(apiKeys.user_id, userId), eq(apiKeys.status, 'active')));
    return result[0].count;
}
export async function hasFreeKey(userId) {
    const result = await db.select({ count: count() })
        .from(apiKeys)
        .where(and(eq(apiKeys.user_id, userId), eq(apiKeys.is_free, true)));
    return result[0].count > 0;
}
export async function upgradeFreeKeysToPaid(userId) {
    const freeKeys = await db.select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.user_id, userId), eq(apiKeys.is_free, true), eq(apiKeys.status, 'active')));
    for (const key of freeKeys) {
        await db.update(apiKeys)
            .set({ is_free: false })
            .where(eq(apiKeys.id, key.id));
        await db.update(keyUsage)
            .set({ daily_limit: 999999 })
            .where(eq(keyUsage.key_id, key.id));
    }
    return { upgraded: freeKeys.length };
}
//# sourceMappingURL=apiKeyModel.js.map