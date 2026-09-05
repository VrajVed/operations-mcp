import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { validateApiKeyMiddleware } from '../middleware/apiKeyAuth.js';
import { getApi, postSolve } from '../controllers/solverController.js';

const router: Router = expressRouter();

router.get('/api', validateApiKeyMiddleware, getApi);
router.post('/v1/solve', validateApiKeyMiddleware, postSolve);

export default router;
