import type { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../services/apiKeyService.js';

export async function validateApiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const rawKey = req.query.apiKey as string || req.headers['x-api-key'] as string;

  if (!rawKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const keyRecord = await validateApiKey(rawKey);
  if (!keyRecord) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if ((keyRecord as { status: string }).status !== 'active') {
    return res.status(403).json({ error: 'API key is inactive' });
  }

  req.keyRecord = keyRecord as any;
  next();
}
