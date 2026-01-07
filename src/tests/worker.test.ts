/**
 * Worker tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BoilerplateMCP } from "../worker/mcp.js";

describe("BoilerplateMCP", () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      BASE_URL: "https://test.workers.dev",
      WIDGET_DOMAIN: "https://test.com",
      ASSETS: {
        fetch: async () =>
          new Response("<html><body>Test</body></html>", {
            headers: { "Content-Type": "text/html" },
          }),
      },
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_SUBSCRIPTION_PRICE_ID: "price_subscription",
      STRIPE_ONETIME_PRICE_ID: "price_onetime",
      STRIPE_METERED_PRICE_ID: "price_metered",
    };
  });

  describe("initialization", () => {
    it("should create an MCP server", () => {
      const mcp = new BoilerplateMCP(mockEnv);
      expect(mcp.server).toBeDefined();
      expect(mcp.server.name).toBe("BoilerplateMCP");
    });
  });
});
