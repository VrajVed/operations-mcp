import type { Request, Response, NextFunction } from 'express';
/**
 * Guards service-to-service routes (the Python compute layer calling back into
 * Express to validate an API key). Not a Clerk session — a static shared secret
 * both processes are given via env. Intended to be reachable only from inside the
 * deployment's private network; the secret is defense in depth on top of that.
 */
export declare function requireInternalSecret(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=internalAuth.d.ts.map