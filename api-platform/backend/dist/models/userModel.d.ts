export declare function createUser(clerkId: string, email: string): Promise<{
    clerk_id: string;
    email: string;
}>;
export declare function getUserByClerkId(clerkId: string): Promise<{
    clerk_id: string;
    email: string;
    subscription_status: string | null;
    razorpay_subscription_id: string | null;
    timezone: string | null;
    created_at: Date | null;
}>;
export declare function updateUserSubscription(clerkId: string, status: string, razorpaySubId: string | null): Promise<{
    updated: boolean;
}>;
export declare function updateUserTimezone(clerkId: string, timezone: string): Promise<{
    updated: boolean;
}>;
//# sourceMappingURL=userModel.d.ts.map