/**
 * Billing tests
 */

import { describe, expect, it } from "vitest";
import { checkEntitlement, getEntitlementStatus } from "../billing/entitlements.js";
import { createStripeClient, PAYMENT_REASONS } from "../billing/stripe.js";
import type { Env } from "../worker/env.js";

// Minimal mock env for testing
type MockEnv = Pick<Env, "STRIPE_SECRET_KEY">;

describe("Stripe Billing", () => {
  describe("Stripe Client", () => {
    it("should throw error when STRIPE_SECRET_KEY is not defined", () => {
      const env = {} as MockEnv as Env;
      expect(() => createStripeClient(env)).toThrow("STRIPE_SECRET_KEY is not defined");
    });

    it("should create client when STRIPE_SECRET_KEY is defined", () => {
      const env = { STRIPE_SECRET_KEY: "sk_test_123" } as MockEnv as Env;
      const client = createStripeClient(env);
      expect(client).toBeDefined();
    });
  });

  describe("Payment Reasons", () => {
    it("should have subscription payment reason", () => {
      expect(PAYMENT_REASONS.SUBSCRIPTION).toContain("subscription");
    });

    it("should have onetime payment reason", () => {
      expect(PAYMENT_REASONS.ONETIME).toContain("one-time payment");
    });

    it("should have metered payment reason", () => {
      expect(PAYMENT_REASONS.METERED).toContain("metered billing");
    });
  });

  describe("Entitlements", () => {
    it("should return default status when no customer ID", async () => {
      const env = {} as MockEnv as Env;
      const status = await getEntitlementStatus(env);
      expect(status.hasSubscription).toBe(false);
      expect(status.subscriptionActive).toBe(false);
      expect(status.hasOnetimePurchase).toBe(false);
      expect(status.meteredUsageRemaining).toBe(3);
    });

    it("should allow free tier for all users", async () => {
      const env = {} as MockEnv as Env;
      const result = await checkEntitlement(env, "free");
      expect(result).toBe(true);
    });

    it("should deny subscription when not subscribed", async () => {
      const env = {} as MockEnv as Env;
      const result = await checkEntitlement(env, "subscription");
      expect(result).toBe(false);
    });

    it("should allow metered usage within free tier", async () => {
      const env = {} as MockEnv as Env;
      const result = await checkEntitlement(env, "metered");
      expect(result).toBe(true);
    });
  });
});
