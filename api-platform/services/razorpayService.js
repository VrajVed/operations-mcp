const Razorpay = require('razorpay');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const {
  getPlanById,
  createSubscription,
  updateSubscriptionStatus,
  getSubscriptionByUser,
  updateUserSubscription,
} = require('../db/queries');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpaySubscription(planId, clerkId) {
  const plan = await getPlanById(planId);
  if (!plan) return { error: 'Invalid plan ID' };

  const razorpaySub = await razorpay.subscriptions.create({
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

function verifyWebhookPayload(payload, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return false;
  return validateWebhookSignature(payload, signature, secret);
}

async function processSubscriptionEvent(event) {
  const sub = event.payload.subscription.entity;

  switch (event.event) {
    case 'subscription.activated':
      await updateSubscriptionStatus(sub.id, 'active', sub.current_start, sub.current_end);
      if (sub.notes?.userId) {
        await updateUserSubscription(sub.notes.userId, 'active', sub.id);
      }
      break;

    case 'subscription.charged':
      await updateSubscriptionStatus(sub.id, 'active', sub.current_start, sub.current_end);
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

module.exports = {
  createRazorpaySubscription,
  verifyWebhookPayload,
  processSubscriptionEvent,
};
