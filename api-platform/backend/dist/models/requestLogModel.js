import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { requestLogs, apiKeys } from '../config/schema.js';
export async function logRequest(keyId, endpoint, method, statusCode, latencyMs) {
    const result = await db.insert(requestLogs).values({
        key_id: keyId,
        endpoint,
        method,
        status_code: statusCode,
        latency_ms: latencyMs,
    }).returning({ id: requestLogs.id });
    return { id: result[0].id };
}
export async function getRequestLogsByUser(userId, limit = 50) {
    return db.select({
        id: requestLogs.id,
        key_id: requestLogs.key_id,
        endpoint: requestLogs.endpoint,
        method: requestLogs.method,
        status_code: requestLogs.status_code,
        latency_ms: requestLogs.latency_ms,
        created_at: requestLogs.created_at,
    })
        .from(requestLogs)
        .innerJoin(apiKeys, eq(requestLogs.key_id, apiKeys.id))
        .where(eq(apiKeys.user_id, userId))
        .orderBy(desc(requestLogs.created_at))
        .limit(limit);
}
//# sourceMappingURL=requestLogModel.js.map