import { Router as expressRouter } from 'express';
import { clerkMiddleware } from '@clerk/express';
import solverRouter from './solver.js';
import keysRouter from './keys.js';
import subscriptionsRouter from './subscriptions.js';
import webhooksRouter from './webhooks.js';
import internalRouter from './internal.js';
import { requireUserId } from '../middleware/authGuard.js';
const router = expressRouter();
// clerkMiddleware() is scoped to only the routes that read req.auth, rather than
// mounted globally. It performs synchronous key parsing/validation on every
// request it touches and throws if Clerk env config is invalid — mounting it
// globally would mean a Clerk misconfiguration takes down /health, webhooks, and
// the internal service-to-service routes too, none of which use Clerk.
const withClerk = clerkMiddleware();
// Webhooks MUST be mounted before the guarded '/v1' mount below. Express runs the
// middleware of a use('/v1', ...) mount for every request whose path starts with
// /v1 — including /v1/webhooks/* — regardless of whether the sub-router matches.
// Mounting these first lets webhook requests terminate before requireUserId runs.
router.use('/v1/webhooks', webhooksRouter);
// Internal service-to-service routes (Python compute layer -> Express).
// Guarded by a shared secret, not by Clerk.
router.use('/internal', internalRouter);
router.use(solverRouter);
router.use('/v1/keys', withClerk, requireUserId, keysRouter);
router.use('/v1', withClerk, requireUserId, subscriptionsRouter);
export default router;
//# sourceMappingURL=index.js.map