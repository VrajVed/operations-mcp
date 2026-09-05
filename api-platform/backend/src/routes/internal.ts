import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { requireInternalSecret } from '../middleware/internalAuth.js';
import { validateKey } from '../controllers/internalController.js';

const router: Router = expressRouter();

router.post('/validate-key', requireInternalSecret, validateKey);

export default router;
