import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import {
  listPlans,
  createSubscription,
  getSubscriptionStatus,
  razorpayWebhook,
} from '../controllers/subscriptionsController.js';

const router: Router = expressRouter();

router.get('/plans', listPlans);
router.post('/subscriptions', createSubscription);
router.get('/subscriptions/status', getSubscriptionStatus);
router.post('/webhooks/razorpay', razorpayWebhook);

export default router;
