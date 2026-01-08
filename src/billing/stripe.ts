/**
 * Stripe client factory and utilities
 */

import Stripe from "stripe";
import type { Env } from "../worker/env.js";

/**
 * Create a Stripe client from environment
 */
export function createStripeClient(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined");
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/**
 * Stripe checkout configuration for different payment modes
 */
export interface StripeCheckoutConfig {
  mode: "payment" | "subscription";
  priceId: string;
  successUrl: string;
  cancelUrl?: string;
  quantity?: number;
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  env: Env,
  config: StripeCheckoutConfig,
  metadata?: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  const stripe = createStripeClient(env);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: config.mode,
    line_items: [
      {
        price: config.priceId,
        quantity: config.quantity || 1,
      },
    ],
    success_url: config.successUrl,
    cancel_url: config.cancelUrl || config.successUrl,
    metadata: metadata || {},
  };

  return await stripe.checkout.sessions.create(params);
}

/**
 * Payment reason constants for Stripe agent toolkit
 */
export const PAYMENT_REASONS = {
  SUBSCRIPTION:
    "This tool requires an active subscription. Your subscription gives you unlimited access to all premium features.",
  ONETIME:
    "This tool requires a one-time payment. Purchase once and use forever.",
  METERED:
    "This tool uses metered billing. Your first 3 uses are free, then we charge 10 cents per use.",
} as const;
