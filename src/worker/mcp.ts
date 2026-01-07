/**
 * MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type { Env } from "./env.js";
import { routesManifest } from "./routesManifest.generated.js";
import { registerFreeTools } from "../tools/index.js";

const DEFAULT_RESOURCE_META = {
  "openai/widgetCSP": {
    connect_domains: [] as string[],
    resource_domains: [] as string[],
  },
  "openai/widgetDomain": undefined as string | undefined,
};

/**
 * Main MCP server Durable Object
 */
export class BoilerplateMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "BoilerplateMCP",
    version: "1.0.0",
  });

  async init() {
    const baseUrl = this.env.BASE_URL;

    if (baseUrl) {
      DEFAULT_RESOURCE_META["openai/widgetCSP"].resource_domains.push(baseUrl);
    } else {
      console.error("BASE_URL is not defined. Set BASE_URL in your environment.");
    }

    if (this.env.WIDGET_DOMAIN) {
      DEFAULT_RESOURCE_META["openai/widgetDomain"] = this.env.WIDGET_DOMAIN;
    } else {
      delete DEFAULT_RESOURCE_META["openai/widgetDomain"];
    }

    // Register UI resources from manifest
    for (const [, routeInfo] of Object.entries(routesManifest)) {
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

    // Register free tools
    registerFreeTools(this.server, this.env, routesManifest);
  }
}
