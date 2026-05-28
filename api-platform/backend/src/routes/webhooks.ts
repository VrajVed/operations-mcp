import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { clerkWebhook } from '../controllers/webhooksController.js';

const router: Router = expressRouter();

router.post('/clerk', clerkWebhook);

export default router;
