import { Router as expressRouter } from 'express';
import { createKey, listKeys, revokeKey } from '../controllers/keysController.js';
const router = expressRouter();
router.post('/', createKey);
router.get('/', listKeys);
router.delete('/:id', revokeKey);
export default router;
//# sourceMappingURL=keys.js.map