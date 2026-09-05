/**
 * Guards service-to-service routes (the Python compute layer calling back into
 * Express to validate an API key). Not a Clerk session — a static shared secret
 * both processes are given via env. Intended to be reachable only from inside the
 * deployment's private network; the secret is defense in depth on top of that.
 */
export function requireInternalSecret(req, res, next) {
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected) {
        console.error('INTERNAL_API_SECRET is not configured; rejecting internal request');
        return res.status(500).json({ error: 'Internal auth not configured' });
    }
    const provided = req.headers['x-internal-secret'];
    if (provided !== expected) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
//# sourceMappingURL=internalAuth.js.map