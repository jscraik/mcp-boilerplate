/**
 * Main worker entry point
 * Routes requests to appropriate handlers
 */

import { BoilerplateMCP } from "./mcp.js";
import { handleRequest } from "./routes.js";
import type { Env } from "./env.js";

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    handleRequest(request, env, ctx),
};

// Export the MCP server class for Wrangler
export { BoilerplateMCP };
