/**
 * Tool registry
 * Registers all tools with the MCP server
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../worker/env.js";
import type { routesManifest } from "../worker/routesManifest.generated";

// Free tools
import { registerHelloWorldTool } from "./free/hello-world.js";

/**
 * Register all free tools with the MCP server
 */
export function registerFreeTools(server: McpServer, env: Env, manifest: typeof routesManifest): void {
  registerHelloWorldTool(server, env, manifest);
}
