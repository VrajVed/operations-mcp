import { Router as expressRouter } from 'express';
import { validateApiKeyMiddleware } from '../middleware/apiKeyAuth.js';
import { getApi, postSolve } from '../controllers/solverController.js';
const router = expressRouter();
router.get('/api', validateApiKeyMiddleware, getApi);
router.post('/v1/solve', validateApiKeyMiddleware, postSolve);
export default router;
//# sourceMappingURL=solver.js.map