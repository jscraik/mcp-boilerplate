/**
 * Main worker entry point
 * Routes requests to appropriate handlers
 */

import type { Env } from "./env.js";
import { MKitMCP } from "./mcp.js";
import { handleRequest } from "./routes.js";

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    handleRequest(request, env, ctx),
};

// Export the MCP server class for Wrangler
export { MKitMCP };
