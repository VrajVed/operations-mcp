import type { Request, Response } from 'express';
import { checkAndIncrement } from '../services/rateLimitService.js';
import { getUserByClerkId, updateUserTimezone, logRequest } from '../models/index.js';

const SOLVER_URL = process.env.SOLVER_URL || 'http://localhost:3001';

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

// Forwards to the Python compute layer's POST /solve. Quota is checked and
// incremented here (Express is the source of truth) before the request ever
// reaches opsmcp; opsmcp's REST bridge does not re-check quota.
export async function postSolve(req: Request, res: Response) {
  const start = Date.now();
  const keyRecord = req.keyRecord!;
  const { tool, input } = req.body as { tool?: string; input?: unknown };

  if (!tool || input === undefined) {
    return res.status(400).json({ error: "Body must include 'tool' and 'input'" });
  }

  const timezone = req.headers['x-timezone'] as string || 'UTC';
  const result = await checkAndIncrement(keyRecord.id, timezone);
  if (!result.allowed) {
    await logRequest(keyRecord.id, `solve:${tool}`, 'POST', 429, Date.now() - start);
    return res.status(429).json({
      error: `Daily limit reached (${result.dailyCount}/${result.dailyLimit}). Subscribe for unlimited access.`,
      subscribeUrl: '/pricing',
      resetsAt: result.resetsAt,
    });
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${SOLVER_URL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, input }),
    });
  } catch (err) {
    await logRequest(keyRecord.id, `solve:${tool}`, 'POST', 502, Date.now() - start);
    return res.status(502).json({ error: 'Solver service unavailable' });
  }

  const data = await upstream.json().catch(() => ({ error: 'Invalid response from solver' }));
  await logRequest(keyRecord.id, `solve:${tool}`, 'POST', upstream.status, Date.now() - start);
  return res.status(upstream.status).json(data);
}
