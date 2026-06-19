import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import solverRouter from './solver.js';
import keysRouter from './keys.js';
import subscriptionsRouter from './subscriptions.js';
import webhooksRouter from './webhooks.js';
import { requireUserId } from '../middleware/authGuard.js';

const router: Router = expressRouter();

router.use(solverRouter);
router.use('/v1/keys', requireUserId, keysRouter);
router.use('/v1', requireUserId, subscriptionsRouter);
router.use('/v1/webhooks', webhooksRouter);

export default router;
