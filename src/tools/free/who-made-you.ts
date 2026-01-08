/**
 * Free tool: who-made-you
 * Returns information about the template creator
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { routesManifest } from "../../worker/routesManifest.generated";

export function registerWhoMadeYouTool(
    server: McpServer,
    _env: unknown,
    manifest: typeof routesManifest
): void {
    server.registerTool(
        "who-made-you",
        {
            title: "Who Made You",
            description: "Returns information about who created this MCP template",
            inputSchema: {},
            _meta: {
                "openai/outputTemplate": `ui://widget/${manifest["who-made-you"].resourceURI}`,
                "openai/toolInvocation/invoking": "Looking up creator info",
                "openai/toolInvocation/invoked": "Found creator info!",
                "openai/widgetAccessible": true,
            },
        },
        async () => {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            description: "This MCP boilerplate template was created as a starting point for building remote MCP servers with OAuth and Stripe integration.",
                            authorsXSocialLink: "https://x.com/gching",
                        }),
                    },
                ],
                structuredContent: {
                    description: "This MCP boilerplate template was created as a starting point for building remote MCP servers with OAuth and Stripe integration.",
                    authorsXSocialLink: "https://x.com/gching",
                },
            };
        }
    );
}
