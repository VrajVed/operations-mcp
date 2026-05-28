import type { Request, Response } from 'express';
export declare function listPlans(req: Request, res: Response): Promise<void>;
export declare function createSubscription(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getSubscriptionStatus(req: Request, res: Response): Promise<void>;
export declare function razorpayWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=subscriptionsController.d.ts.map