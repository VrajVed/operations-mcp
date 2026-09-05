import type { Request, Response } from 'express';
/**
 * Called by the Python MCP server (opsmcp) on every tool invocation. This is what
 * makes an API key generated on the platform meaningful inside an MCP client like
 * Claude Desktop or Cursor: the key travels with the tool call, gets validated and
 * quota-checked here exactly as the REST /api path does, and the call is logged
 * against the same key_usage / request_logs rows either path would touch.
 */
export declare function validateKey(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=internalController.d.ts.map