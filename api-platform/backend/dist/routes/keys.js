import { Router as expressRouter } from 'express';
import { requireAuth } from '@clerk/express';
import { createKey, listKeys, revokeKey } from '../controllers/keysController.js';
const router = expressRouter();
router.post('/', requireAuth(), createKey);
router.get('/', requireAuth(), listKeys);
router.delete('/:id', requireAuth(), revokeKey);
export default router;
//# sourceMappingURL=keys.js.map