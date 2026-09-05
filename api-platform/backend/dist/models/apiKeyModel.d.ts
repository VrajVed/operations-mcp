export declare function createApiKey(userId: string, name: string, hashedKey: string, mask: string, isFree?: boolean): Promise<{
    id: string;
    userId: string;
    name: string;
    mask: string;
    isFree: boolean;
}>;
export declare function getApiKeyByHash(hashedKey: string): Promise<{
    id: string;
    user_id: string;
    name: string;
    hashed_key: string;
    mask: string;
    is_free: boolean | null;
    status: string | null;
    created_at: Date | null;
}>;
export declare function getApiKeysByUser(userId: string): Promise<{
    id: string;
    user_id: string;
    name: string;
    hashed_key: string;
    mask: string;
    is_free: boolean | null;
    status: string | null;
    created_at: Date | null;
    daily_count: number | null;
    daily_limit: number | null;
    last_reset: Date | null;
}[]>;
export declare function revokeApiKey(keyId: string, userId: string): Promise<{
    revoked: boolean;
}>;
export declare function countActiveKeysByUser(userId: string): Promise<number>;
export declare function hasFreeKey(userId: string): Promise<boolean>;
export declare function upgradeFreeKeysToPaid(userId: string): Promise<{
    upgraded: number;
}>;
//# sourceMappingURL=apiKeyModel.d.ts.map