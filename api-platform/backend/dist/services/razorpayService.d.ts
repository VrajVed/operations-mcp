export declare function createRazorpaySubscription(planId: string, clerkId: string): Promise<{
    error: string;
    subscriptionId?: undefined;
    checkoutUrl?: undefined;
    status?: undefined;
} | {
    subscriptionId: string;
    checkoutUrl: string;
    status: "active" | "created" | "authenticated" | "pending" | "halted" | "cancelled" | "completed" | "expired";
    error?: undefined;
}>;
export declare function verifyWebhookPayload(payload: Buffer, signature: string): any;
export declare function processSubscriptionEvent(event: {
    event: string;
    payload: {
        subscription: {
            entity: any;
        };
    };
}): Promise<void>;
//# sourceMappingURL=razorpayService.d.ts.map