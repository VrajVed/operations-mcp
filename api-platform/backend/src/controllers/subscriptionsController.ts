import type { Request, Response } from 'express';
import {
  createRazorpaySubscription,
  verifyWebhookPayload,
  processSubscriptionEvent,
} from '../services/razorpayService.js';
import { getAllPlans, getUserByClerkId, getSubscriptionByUser, upgradeFreeKeysToPaid } from '../models/index.js';

export async function listPlans(req: Request, res: Response) {
  try {
    const plans = await getAllPlans();
    res.json((plans as any[]).map((p: any) => ({
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
}

export async function createSubscription(req: Request, res: Response) {
  try {
    const clerkId = req.auth!.userId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const result = await createRazorpaySubscription(planId, clerkId);

    if ((result as { error?: string }).error) {
      return res.status(400).json({ error: (result as { error: string }).error });
    }

    res.json({
      subscriptionId: (result as { subscriptionId: string }).subscriptionId,
      checkoutUrl: (result as { checkoutUrl: string }).checkoutUrl,
      status: (result as { status: string }).status,
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

export async function getSubscriptionStatus(req: Request, res: Response) {
  try {
    const clerkId = req.auth!.userId;
    const user = await getUserByClerkId(clerkId);
    const subscription = await getSubscriptionByUser(clerkId);

    res.json({
      status: user ? (user as { subscription_status: string }).subscription_status : 'inactive',
      plan: subscription ? (subscription as { razorpay_plan_id: string }).razorpay_plan_id : null,
      currentPeriodEnd: subscription && (subscription as { current_period_end: number }).current_period_end
        ? new Date((subscription as { current_period_end: number }).current_period_end * 1000).toISOString()
        : null,
      checkoutUrl: subscription ? (subscription as { short_url: string }).short_url : null,
    });
  } catch (err) {
    console.error('Get subscription status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function razorpayWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!verifyWebhookPayload(req.body as Buffer, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body as unknown as string);
    await processSubscriptionEvent(event);

    res.json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
