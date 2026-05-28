import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../config/schema.js';

export async function createUser(clerkId: string, email: string) {
  await db.insert(users).values({ clerk_id: clerkId, email });
  return { clerk_id: clerkId, email };
}

export async function getUserByClerkId(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerk_id, clerkId));
  return result[0] ?? null;
}

export async function updateUserSubscription(clerkId: string, status: string, razorpaySubId: string | null) {
  const result = await db.update(users)
    .set({ subscription_status: status, razorpay_subscription_id: razorpaySubId })
    .where(eq(users.clerk_id, clerkId))
    .returning();
  return { updated: result.length > 0 };
}

export async function updateUserTimezone(clerkId: string, timezone: string) {
  const result = await db.update(users)
    .set({ timezone })
    .where(eq(users.clerk_id, clerkId))
    .returning();
  return { updated: result.length > 0 };
}
