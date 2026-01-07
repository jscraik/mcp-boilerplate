import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { env } from "cloudflare:workers";
import * as z from "zod/v3";

import { routesManifest } from "./routesManifest.generated";

const DEFAULT_RESOURCE_META = {
  "openai/widgetCSP": {
    connect_domains: [
      "https://api.mapbox.com/",
      "https://events.mapbox.com/",
    ] as string[],
    resource_domains: ["https://persistent.oaistatic.com"] as string[],
  },
  "openai/widgetDomain": env.WIDGET_DOMAIN as string | undefined,
};

if (env.WORKER_DOMAIN_BASE) {
  DEFAULT_RESOURCE_META["openai/widgetCSP"].resource_domains.push(
    env.WORKER_DOMAIN_BASE
  );
} else {
  console.error(
    "env.WORKER_DOMAIN_BASE is not defined. For this template to work, you must provide WORKER_DOMAIN_BASE"
  );
}

if (!env.WIDGET_DOMAIN) {
  delete DEFAULT_RESOURCE_META["openai/widgetDomain"];
}

export class TemplateMCPServer extends McpAgent<Env> {
  server = new McpServer({ name: "Pizzaz", version: "v1.0.0" });

  async init() {
    // Loop over our manifest, generate resources.
    for (const [, routeInfo] of Object.entries(routesManifest)) {
      // Construct the resource URI with the unique content hash
      const resourceUri = `ui://widget/${routeInfo.resourceURI}`;

      this.server.registerResource(
        routeInfo.resourceName,
        `ui://widget/${routeInfo.resourceURI}`,
        {},
        async () => {
          const response = await this.env.ASSETS.fetch(
            new Request(`http://localhost${routeInfo.originalUrlPath}`)
          );
          const html = await response.text();

          return {
            contents: [
              {
                uri: resourceUri,
                mimeType: "text/html+skybridge",
                text: html,
                _meta: DEFAULT_RESOURCE_META,
              },
            ],
          };
        }
      );
    }

    this.server.registerTool(
      "pizzaz-map",
      {
        title: "Show Pizza Map",
        _meta: {
          "openai/outputTemplate": `ui://widget/${routesManifest["map"].resourceURI}`,
          "openai/toolInvocation/invoking": "Hand-tossing a map",
          "openai/toolInvocation/invoked": "Served a fresh map",
        },
        inputSchema: { pizzaTopping: z.string() },
      },
      async () => {
        return {
          content: [{ type: "text" as const, text: "Rendered a pizza map!" }],
          _meta: {
            initialRoute: "/map",
          },
        };
      }
    );

    this.server.registerTool(
      "pizzaz-carousel",
      {
        title: "Show Pizza Carousel",
        _meta: {
          "openai/outputTemplate": `ui://widget/${routesManifest["carousel"].resourceURI}`,
          "openai/toolInvocation/invoking": "Carousel some spots",
          "openai/toolInvocation/invoked": "Served a fresh carousel",
        },
        inputSchema: { pizzaTopping: z.string() },
      },
      async () => {
        return {
          content: [
            { type: "text" as const, text: "Rendered a pizza carousel!" },
          ],
          _meta: {
            initialRoute: "/carousel",
          },
        };
      }
    );

    this.server.registerTool(
      "pizzaz-albums",
      {
        title: "Show Pizza Album",
        _meta: {
          "openai/outputTemplate": `ui://widget/${routesManifest["albums"].resourceURI}`,
          "openai/toolInvocation/invoking": "Hand-tossing an album",
          "openai/toolInvocation/invoked": "Served a fresh album",
        },
        inputSchema: { pizzaTopping: z.string() },
      },
      async () => {
        return {
          content: [{ type: "text" as const, text: "Rendered a pizza album!" }],
          _meta: {
            initialRoute: "/albums",
          },
        };
      }
    );

    this.server.registerTool(
      "pizzaz-list",
      {
        title: "Show Pizza List",
        _meta: {
          "openai/outputTemplate": `ui://widget/${routesManifest["list"].resourceURI}`,
          "openai/toolInvocation/invoking": "Hand-tossing a list",
          "openai/toolInvocation/invoked": "Served a fresh list",
        },
        inputSchema: { pizzaTopping: z.string() },
      },
      async () => {
        return {
          content: [{ type: "text" as const, text: "Rendered a pizza list!" }],
          _meta: {
            initialRoute: "/list",
          },
        };
      }
    );

    this.server.registerTool(
      "pizzaz-video",
      {
        title: "Show Pizza Video",
        _meta: {
          "openai/outputTemplate": `ui://widget/${routesManifest["video"].resourceURI}`,
          "openai/toolInvocation/invoking": "Hand-tossing a video",
          "openai/toolInvocation/invoked": "Served a fresh video",
        },
        inputSchema: { pizzaTopping: z.string() },
      },
      async () => {
        return {
          content: [{ type: "text" as const, text: "Rendered a pizza video!" }],
          _meta: {
            initialRoute: "/video",
          },
        };
      }
    );
  }
}

export default TemplateMCPServer.serve("/mcp");
