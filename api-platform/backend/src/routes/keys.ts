import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { requireAuth } from '@clerk/express';
import { createKey, listKeys, revokeKey } from '../controllers/keysController.js';

const router: Router = expressRouter();

router.post('/', requireAuth(), createKey);
router.get('/', requireAuth(), listKeys);
router.delete('/:id', requireAuth(), revokeKey);

export default router;
