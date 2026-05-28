import { eq, and, count } from 'drizzle-orm';
import { db } from '../config/database.js';
import { apiKeys, keyUsage } from '../config/schema.js';
import { v4 as uuidv4 } from 'uuid';

export async function createApiKey(userId: string, name: string, hashedKey: string, mask: string, isFree = false) {
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

export async function getApiKeyByHash(hashedKey: string) {
  const result = await db.select().from(apiKeys).where(eq(apiKeys.hashed_key, hashedKey));
  return result[0] ?? null;
}

export async function getApiKeysByUser(userId: string) {
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

export async function revokeApiKey(keyId: string, userId: string) {
  const result = await db.update(apiKeys)
    .set({ status: 'revoked' })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.user_id, userId)))
    .returning();
  return { revoked: result.length > 0 };
}

export async function countActiveKeysByUser(userId: string) {
  const result = await db.select({ count: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.user_id, userId), eq(apiKeys.status, 'active')));
  return result[0].count;
}
