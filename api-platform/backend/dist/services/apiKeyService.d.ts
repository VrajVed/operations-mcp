export declare function hashApiKey(apiKey: string): string;
export declare function generateApiKey(): {
    apiKey: string;
    hashedAPIKey: string;
    mask: string;
};
export declare function validateApiKey(rawKey: string): Promise<{
    id: string;
    user_id: string;
    name: string;
    hashed_key: string;
    mask: string;
    is_free: boolean | null;
    status: string | null;
    created_at: Date | null;
} | null>;
//# sourceMappingURL=apiKeyService.d.ts.map