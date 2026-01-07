/**
 * Tool registry
 * Registers all tools with the MCP server
 */

import type { experimental_PaidMcpAgent as PaidMcpAgent } from "@stripe/agent-toolkit/cloudflare";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../worker/env.js";
import type { routesManifest } from "../plugins/routesManifest.generated";

// Free tools
import { registerHelloWorldTool } from "./free/hello-world.js";

// Paid tools
import { registerSubscriptionTool } from "./paid/subscription.js";
import { registerOnetimeTool } from "./paid/onetime.js";
import { registerMeteredTool } from "./paid/metered.js";

/**
 * Register all free tools with the MCP server
 */
export function registerFreeTools(server: McpServer, env: Env, manifest: typeof routesManifest): void {
  registerHelloWorldTool(server, env, manifest);
}

/**
 * Register all paid tools with the Stripe agent
 */
export function registerPaidTools(agent: PaidMcpAgent<Env, unknown, unknown>, env: Env): void {
  registerSubscriptionTool(agent, env);
  registerOnetimeTool(agent, env);
  registerMeteredTool(agent, env);
}
