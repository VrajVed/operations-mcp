import { Router as expressRouter } from 'express';
import { clerkWebhook } from '../controllers/webhooksController.js';
import { razorpayWebhook } from '../controllers/subscriptionsController.js';
const router = expressRouter();
router.post('/clerk', clerkWebhook);
router.post('/razorpay', razorpayWebhook);
export default router;
//# sourceMappingURL=webhooks.js.map