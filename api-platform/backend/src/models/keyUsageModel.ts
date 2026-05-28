import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { keyUsage } from '../config/schema.js';

export async function getKeyUsage(keyId: string) {
  const result = await db.select().from(keyUsage).where(eq(keyUsage.key_id, keyId));
  return result[0] ?? null;
}

export async function incrementKeyUsage(keyId: string) {
  const result = await db.update(keyUsage)
    .set({
      daily_count: sql`${keyUsage.daily_count} + 1`,
      total_requests: sql`${keyUsage.total_requests} + 1`,
    })
    .where(eq(keyUsage.key_id, keyId))
    .returning();
  return { updated: result.length > 0 };
}

export async function resetKeyUsage(keyId: string) {
  const result = await db.update(keyUsage)
    .set({ daily_count: 0, last_reset: new Date() })
    .where(eq(keyUsage.key_id, keyId))
    .returning();
  return { updated: result.length > 0 };
}
