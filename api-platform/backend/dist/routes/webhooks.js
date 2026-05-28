import { Router as expressRouter } from 'express';
import { clerkWebhook } from '../controllers/webhooksController.js';
const router = expressRouter();
router.post('/clerk', clerkWebhook);
export default router;
//# sourceMappingURL=webhooks.js.map