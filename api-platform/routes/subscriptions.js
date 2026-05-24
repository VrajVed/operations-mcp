const express = require('express');
const router = express.Router();
const { requireAuth } = require('@clerk/express');
const {
  createRazorpaySubscription,
  verifyWebhookPayload,
  processSubscriptionEvent,
} = require('../services/razorpayService');
const { getAllPlans, getUserByClerkId, getSubscriptionByUser } = require('../db/queries');

// GET /v1/plans - List all available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await getAllPlans();
    res.json(plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      interval: p.interval,
      description: p.description,
    })));
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/subscriptions - Create a new Razorpay subscription
router.post('/subscriptions', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const result = await createRazorpaySubscription(planId, clerkId);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      subscriptionId: result.subscriptionId,
      checkoutUrl: result.checkoutUrl,
      status: result.status,
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// GET /v1/subscriptions/status - Get user's subscription status
router.get('/subscriptions/status', requireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const user = await getUserByClerkId(clerkId);
    const subscription = await getSubscriptionByUser(clerkId);

    res.json({
      status: user?.subscription_status || 'inactive',
      plan: subscription?.razorpay_plan_id || null,
      currentPeriodEnd: subscription?.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      checkoutUrl: subscription?.short_url || null,
    });
  } catch (err) {
    console.error('Get subscription status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /v1/webhooks/razorpay - Handle Razorpay webhooks
router.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!verifyWebhookPayload(req.body, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body);
    await processSubscriptionEvent(event);

    res.json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
