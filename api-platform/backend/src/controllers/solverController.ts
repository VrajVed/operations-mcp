import type { Request, Response } from 'express';
import { checkAndIncrement } from '../services/rateLimitService.js';
import { getUserByClerkId, updateUserTimezone } from '../models/index.js';

export async function getApi(req: Request, res: Response) {
  const keyRecord = req.keyRecord!;
  const timezone = req.headers['x-timezone'] as string || 'UTC';

  if (keyRecord.is_free) {
    const result = await checkAndIncrement(keyRecord.id, timezone);
    if (!result.allowed) {
      return res.status(429).json({
        error: `Daily limit reached (${result.dailyCount}/${result.dailyLimit}). Subscribe for unlimited access.`,
        subscribeUrl: '/pricing',
        resetsAt: result.resetsAt,
      });
    }
  }

  getUserByClerkId(keyRecord.user_id).then(user => {
    if (user && (user as { timezone: string }).timezone !== timezone) {
      updateUserTimezone(keyRecord.user_id, timezone);
    }
  }).catch(() => {});

  res.json({ message: 'Hello from the API!' });
}
