import Razorpay from 'razorpay';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils.js';
import { getPlanById, createSubscription, updateSubscriptionStatus, updateUserSubscription, upgradeFreeKeysToPaid, } from '../models/index.js';
let razorpay = null;
function getRazorpay() {
    if (!razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            throw new Error('Razorpay keys are not configured');
        }
        razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return razorpay;
}
export async function createRazorpaySubscription(planId, clerkId) {
    const plan = await getPlanById(planId);
    if (!plan)
        return { error: 'Invalid plan ID' };
    const razorpaySub = await getRazorpay().subscriptions.create({
        plan_id: planId,
        total_count: 12,
        customer_notify: true,
        notes: { userId: clerkId },
    });
    await createSubscription(razorpaySub.id, clerkId, planId, razorpaySub.short_url);
    await updateUserSubscription(clerkId, 'inactive', razorpaySub.id);
    return {
        subscriptionId: razorpaySub.id,
        checkoutUrl: razorpaySub.short_url,
        status: razorpaySub.status,
    };
}
export function verifyWebhookPayload(payload, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret)
        return false;
    return validateWebhookSignature(payload.toString('utf8'), signature, secret);
}
export async function processSubscriptionEvent(event) {
    const sub = event.payload.subscription.entity;
    switch (event.event) {
        case 'subscription.activated':
            await updateSubscriptionStatus(sub.id, 'active', sub.current_start, sub.current_end);
            if (sub.notes?.userId) {
                await updateUserSubscription(sub.notes.userId, 'active', sub.id);
                await upgradeFreeKeysToPaid(sub.notes.userId);
            }
            break;
        case 'subscription.charged':
            await updateSubscriptionStatus(sub.id, 'active', sub.current_start, sub.current_end);
            if (sub.notes?.userId) {
                await upgradeFreeKeysToPaid(sub.notes.userId);
            }
            break;
        case 'subscription.halted':
            await updateSubscriptionStatus(sub.id, 'halted', sub.current_start, sub.current_end);
            if (sub.notes?.userId) {
                await updateUserSubscription(sub.notes.userId, 'past_due', sub.id);
            }
            break;
        case 'subscription.cancelled':
            await updateSubscriptionStatus(sub.id, 'cancelled', sub.current_start, sub.current_end);
            if (sub.notes?.userId) {
                await updateUserSubscription(sub.notes.userId, 'cancelled', sub.id);
            }
            break;
        case 'subscription.completed':
            await updateSubscriptionStatus(sub.id, 'completed', sub.current_start, sub.current_end);
            if (sub.notes?.userId) {
                await updateUserSubscription(sub.notes.userId, 'inactive', null);
            }
            break;
    }
}
//# sourceMappingURL=razorpayService.js.map