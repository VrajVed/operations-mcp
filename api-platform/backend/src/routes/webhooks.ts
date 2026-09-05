import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { clerkWebhook } from '../controllers/webhooksController.js';
import { razorpayWebhook } from '../controllers/subscriptionsController.js';

const router: Router = expressRouter();

router.post('/clerk', clerkWebhook);
router.post('/razorpay', razorpayWebhook);

export default router;
