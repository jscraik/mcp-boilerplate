/**
 * Entitlement checking utilities for Stripe subscriptions
 */

import Stripe from "stripe";
import type { Env } from "../worker/env.js";
import { createStripeClient } from "./stripe.js";

/**
 * User entitlement status
 */
export interface EntitlementStatus {
  hasSubscription: boolean;
  subscriptionActive: boolean;
  subscriptionStatus?: Stripe.Subscription.Status;
  hasOnetimePurchase: boolean;
  meteredUsageRemaining: number;
}

/**
 * Get entitlement status for a user
 * In production, you would store customer_id mappings in a database
 */
export async function getEntitlementStatus(
  env: Env,
  customerId?: string
): Promise<EntitlementStatus> {
  if (!customerId) {
    return {
      hasSubscription: false,
      subscriptionActive: false,
      hasOnetimePurchase: false,
      meteredUsageRemaining: 3, // Free tier
    };
  }

  const stripe = createStripeClient(env);

  // Check for active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  const hasSubscription = subscriptions.data.length > 0;
  const subscriptionStatus = hasSubscription ? subscriptions.data[0]?.status : undefined;

  // Check for one-time purchases
  // In production, you'd track this in your database
  const hasOnetimePurchase = false;

  return {
    hasSubscription,
    subscriptionActive: hasSubscription && subscriptionStatus === "active",
    subscriptionStatus,
    hasOnetimePurchase,
    meteredUsageRemaining: hasSubscription ? -1 : 3, // -1 = unlimited
  };
}

/**
 * Check if user has access to a specific tier
 */
export async function checkEntitlement(
  env: Env,
  tier: "free" | "subscription" | "onetime" | "metered",
  customerId?: string
): Promise<boolean> {
  const status = await getEntitlementStatus(env, customerId);

  switch (tier) {
    case "free":
      return true;
    case "subscription":
      return status.subscriptionActive;
    case "onetime":
      return status.hasOnetimePurchase;
    case "metered":
      return status.meteredUsageRemaining > 0 || status.subscriptionActive;
    default:
      return false;
  }
}
