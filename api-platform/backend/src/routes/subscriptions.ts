import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { requireAuth } from '@clerk/express';
import {
  listPlans,
  createSubscription,
  getSubscriptionStatus,
  razorpayWebhook,
} from '../controllers/subscriptionsController.js';

const router: Router = expressRouter();

router.get('/plans', listPlans);
router.post('/subscriptions', requireAuth(), createSubscription);
router.get('/subscriptions/status', requireAuth(), getSubscriptionStatus);
router.post('/webhooks/razorpay', razorpayWebhook);

export default router;
