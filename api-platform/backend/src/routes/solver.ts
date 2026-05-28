import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { validateApiKeyMiddleware } from '../middleware/apiKeyAuth.js';
import { getApi } from '../controllers/solverController.js';

const router: Router = expressRouter();

router.get('/api', validateApiKeyMiddleware, getApi);

export default router;
