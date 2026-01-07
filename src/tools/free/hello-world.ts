/**
 * Free tool: hello-world
 * A simple example tool that doesn't require authentication or payment
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../../worker/env.js";
import type { routesManifest } from "../../worker/routesManifest.generated";

export function registerHelloWorldTool(
  server: McpServer,
  env: Env,
  manifest: typeof routesManifest
): void {
  server.registerTool(
    "hello-world",
    {
      title: "Hello World",
      description: "A simple greeting tool that anyone can use",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name to greet",
          },
        },
      },
      _meta: {
        "openai/outputTemplate": `ui://widget/${manifest["hello-world"].resourceURI}`,
        "openai/toolInvocation/invoking": "Saying hello",
        "openai/toolInvocation/invoked": "Hello said!",
        "openai/widgetAccessible": true,
      },
    },
    async ({ name }: { name?: string }) => {
      return {
        content: [
          {
            type: "text",
            text: `Hello${name ? ` ${name}` : " World"}!`,
          },
        ],
      };
    }
  );
}
