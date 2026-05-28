import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { subscriptions } from '../config/schema.js';

export async function createSubscription(id: string, userId: string, razorpayPlanId: string, shortUrl: string) {
  await db.insert(subscriptions).values({
    id,
    user_id: userId,
    razorpay_plan_id: razorpayPlanId,
    short_url: shortUrl,
  });
  return { id, userId, razorpayPlanId, shortUrl };
}

export async function updateSubscriptionStatus(id: string, status: string, currentPeriodStart: number, currentPeriodEnd: number) {
  const result = await db.update(subscriptions)
    .set({ status, current_period_start: currentPeriodStart, current_period_end: currentPeriodEnd })
    .where(eq(subscriptions.id, id))
    .returning();
  return { updated: result.length > 0 };
}

export async function getSubscriptionByUser(userId: string) {
  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .orderBy(desc(subscriptions.created_at))
    .limit(1);
  return result[0] ?? null;
}
