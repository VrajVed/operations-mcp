export declare function logRequest(keyId: string, endpoint: string, method: string, statusCode: number, latencyMs: number): Promise<{
    id: number;
}>;
export declare function getRequestLogsByUser(userId: string, limit?: number): Promise<{
    id: number;
    key_id: string | null;
    endpoint: string;
    method: string;
    status_code: number | null;
    latency_ms: number | null;
    created_at: Date | null;
}[]>;
//# sourceMappingURL=requestLogModel.d.ts.map