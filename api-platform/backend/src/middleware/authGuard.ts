import type { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';
import { getUserByClerkId, createUser } from '../models/userModel.js';

// Origins allowed to present a session token to this API. Must include the
// deployed frontend's origin in production or Clerk rejects every manual token
// verification below. Comma-separated via AUTHORIZED_PARTIES; falls back to the
// local dev origins used by `npm run dev` on both sides.
const AUTHORIZED_PARTIES = process.env.AUTHORIZED_PARTIES
  ? process.env.AUTHORIZED_PARTIES.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:8080'];

export async function requireUserId(req: Request, res: Response, next: NextFunction) {
  let userId = req.auth?.userId;
  const authHeader = req.headers.authorization;

  if (!userId && authHeader?.startsWith('Bearer ')) {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
      const url = `${protocol}://${host}${req.originalUrl || req.url}`;
      const state = await clerkClient.authenticateRequest(new Request(url, {
        method: req.method,
        headers: new Headers(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
      }), {
        authorizedParties: AUTHORIZED_PARTIES,
      });
      if (state.isAuthenticated) {
        const auth = state.toAuth();
        userId = auth.userId ?? undefined;
        if (userId) {
          (req as any).auth = auth;
        }
      }
    } catch (err) {
      console.error('[authGuard] Manual token verification failed:', err);
    }
  }

  console.log(`[authGuard] ${req.method} ${req.path} userId=${userId ?? 'missing'} authHeader=${authHeader ? 'present' : 'missing'}`);

  if (!userId) {
    console.error('Auth guard blocked request: req.auth.userId is missing', req.path);
    return res.status(401).json({ error: 'Unauthorized: user ID missing from session' });
  }

  try {
    let user = await getUserByClerkId(userId);
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        return res.status(400).json({ error: 'User email not available' });
      }
      await createUser(userId, email);
      console.log(`[authGuard] Auto-created user ${email}`);
    }
  } catch (err) {
    console.error('[authGuard] Failed to auto-create user:', err);
    return res.status(500).json({ error: 'Failed to initialize user' });
  }

  next();
}
