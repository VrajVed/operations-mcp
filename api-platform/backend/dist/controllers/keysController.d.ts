import type { Request, Response } from 'express';
export declare function createKey(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function listKeys(req: Request, res: Response): Promise<void>;
export declare function revokeKey(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=keysController.d.ts.map