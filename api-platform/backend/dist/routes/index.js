import { Router as expressRouter } from 'express';
import solverRouter from './solver.js';
import keysRouter from './keys.js';
import subscriptionsRouter from './subscriptions.js';
import webhooksRouter from './webhooks.js';
const router = expressRouter();
router.use(solverRouter);
router.use('/v1/keys', keysRouter);
router.use('/v1', subscriptionsRouter);
router.use('/v1/webhooks', webhooksRouter);
export default router;
//# sourceMappingURL=index.js.map