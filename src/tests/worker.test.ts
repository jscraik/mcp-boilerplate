/**
 * Worker tests
 * 
 * Note: Full integration tests for Durable Objects and routes require miniflare
 * or the Cloudflare Workers test environment. These are basic unit tests for
 * modules that don't depend on Cloudflare-specific imports.
 */

import { describe, expect, it } from "vitest";

describe("Worker Configuration", () => {
  describe("Tool Registration", () => {
    it("should export registerFreeTools function", async () => {
      const { registerFreeTools } = await import("../tools/index.js");
      expect(typeof registerFreeTools).toBe("function");
    });

    it("should export registerPaidTools function", async () => {
      const { registerPaidTools } = await import("../tools/index.js");
      expect(typeof registerPaidTools).toBe("function");
    });
  });

  describe("Billing Utilities", () => {
    it("should export createStripeClient function", async () => {
      const { createStripeClient } = await import("../billing/stripe.js");
      expect(typeof createStripeClient).toBe("function");
    });

    it("should export PAYMENT_REASONS constants", async () => {
      const { PAYMENT_REASONS } = await import("../billing/stripe.js");
      expect(PAYMENT_REASONS).toBeDefined();
      expect(PAYMENT_REASONS.SUBSCRIPTION).toBeDefined();
      expect(PAYMENT_REASONS.ONETIME).toBeDefined();
      expect(PAYMENT_REASONS.METERED).toBeDefined();
    });
  });
});
