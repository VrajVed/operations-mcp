export declare function getAllPlans(): Promise<{
    id: string;
    name: string;
    price: number;
    currency: string | null;
    interval: string | null;
    description: string | null;
}[]>;
export declare function getPlanById(planId: string): Promise<{
    id: string;
    name: string;
    price: number;
    currency: string | null;
    interval: string | null;
    description: string | null;
}>;
//# sourceMappingURL=planModel.d.ts.map