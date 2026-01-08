/**
 * Tool registry
 * Registers all tools with the MCP server
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../worker/env.js";
import type { BoilerplateMCP } from "../worker/mcp.js";
import type { routesManifest } from "../worker/routesManifest.generated";

// Free tools
import { registerHelloWorldTool } from "./free/hello-world.js";
import { registerWhoMadeYouTool } from "./free/who-made-you.js";

// Paid tools
import { registerMeteredTool } from "./paid/metered.js";
import { registerOnetimeTool } from "./paid/onetime.js";
import { registerSubscriptionTool } from "./paid/subscription.js";

/**
 * Register all free tools with the MCP server
 */
export function registerFreeTools(server: McpServer, env: Env, manifest: typeof routesManifest): void {
  registerHelloWorldTool(server, env, manifest);
  registerWhoMadeYouTool(server, env, manifest);
}

/**
 * Register all paid tools with the MCP agent
 * These tools require Stripe payment before use
 */
export function registerPaidTools(agent: BoilerplateMCP, env: Env): void {
  // Only register paid tools if Stripe is configured
  if (!env.STRIPE_SECRET_KEY) {
    console.warn("Stripe not configured - paid tools will not be available");
    return;
  }

  registerSubscriptionTool(agent, env);
  registerOnetimeTool(agent, env);
  registerMeteredTool(agent, env);
}
