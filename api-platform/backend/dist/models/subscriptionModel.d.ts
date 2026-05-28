export declare function createSubscription(id: string, userId: string, razorpayPlanId: string, shortUrl: string): Promise<{
    id: string;
    userId: string;
    razorpayPlanId: string;
    shortUrl: string;
}>;
export declare function updateSubscriptionStatus(id: string, status: string, currentPeriodStart: number, currentPeriodEnd: number): Promise<{
    updated: boolean;
}>;
export declare function getSubscriptionByUser(userId: string): Promise<{
    id: string;
    user_id: string;
    razorpay_plan_id: string;
    status: string | null;
    current_period_start: number | null;
    current_period_end: number | null;
    short_url: string | null;
    created_at: Date | null;
}>;
//# sourceMappingURL=subscriptionModel.d.ts.map