export declare function getKeyUsage(keyId: string): Promise<{
    key_id: string;
    daily_count: number | null;
    daily_limit: number | null;
    last_reset: Date | null;
    total_requests: number | null;
}>;
export declare function incrementKeyUsage(keyId: string): Promise<{
    updated: boolean;
}>;
export declare function resetKeyUsage(keyId: string): Promise<{
    updated: boolean;
}>;
//# sourceMappingURL=keyUsageModel.d.ts.map