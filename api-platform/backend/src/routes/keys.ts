import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import { createKey, listKeys, revokeKey } from '../controllers/keysController.js';

const router: Router = expressRouter();

router.post('/', createKey);
router.get('/', listKeys);
router.delete('/:id', revokeKey);

export default router;
