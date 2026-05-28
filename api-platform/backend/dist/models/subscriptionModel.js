import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { subscriptions } from '../config/schema.js';
export async function createSubscription(id, userId, razorpayPlanId, shortUrl) {
    await db.insert(subscriptions).values({
        id,
        user_id: userId,
        razorpay_plan_id: razorpayPlanId,
        short_url: shortUrl,
    });
    return { id, userId, razorpayPlanId, shortUrl };
}
export async function updateSubscriptionStatus(id, status, currentPeriodStart, currentPeriodEnd) {
    const result = await db.update(subscriptions)
        .set({ status, current_period_start: currentPeriodStart, current_period_end: currentPeriodEnd })
        .where(eq(subscriptions.id, id))
        .returning();
    return { updated: result.length > 0 };
}
export async function getSubscriptionByUser(userId) {
    const result = await db.select().from(subscriptions)
        .where(eq(subscriptions.user_id, userId))
        .orderBy(desc(subscriptions.created_at))
        .limit(1);
    return result[0] ?? null;
}
//# sourceMappingURL=subscriptionModel.js.map