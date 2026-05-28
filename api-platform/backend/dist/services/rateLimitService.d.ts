export declare function checkAndIncrement(keyId: string, timezone?: string): Promise<{
    allowed: boolean;
    dailyCount: number;
    dailyLimit: number;
    resetsAt?: undefined;
} | {
    allowed: boolean;
    dailyCount: number;
    dailyLimit: number;
    resetsAt: string;
}>;
export declare function getUsageStatus(keyId: string): Promise<{
    dailyCount: number;
    dailyLimit: number;
    totalRequests: number;
    lastReset?: undefined;
} | {
    dailyCount: number;
    dailyLimit: number;
    lastReset: Date | null;
    totalRequests: number;
}>;
//# sourceMappingURL=rateLimitService.d.ts.map