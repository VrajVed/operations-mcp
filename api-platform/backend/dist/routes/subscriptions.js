import { Router as expressRouter } from 'express';
import { listPlans, createSubscription, getSubscriptionStatus, } from '../controllers/subscriptionsController.js';
const router = expressRouter();
// Note: POST /v1/webhooks/razorpay is registered in routes/webhooks.ts, which is
// mounted ahead of this guarded router so Razorpay is not asked for a Clerk JWT.
router.get('/plans', listPlans);
router.post('/subscriptions', createSubscription);
router.get('/subscriptions/status', getSubscriptionStatus);
export default router;
//# sourceMappingURL=subscriptions.js.map