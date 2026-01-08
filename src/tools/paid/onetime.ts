/**
 * Paid tool: onetime_feature
 * Requires one-time Stripe payment
 */

import { z } from "zod";
import { PAYMENT_REASONS } from "../../billing/stripe.js";
import type { Env } from "../../worker/env.js";
import type { BoilerplateMCP } from "../../worker/mcp.js";

export function registerOnetimeTool(
  agent: BoilerplateMCP,
  env: Env
): void {
  const priceId = env.STRIPE_ONETIME_PRICE_ID;
  const baseUrl = env.BASE_URL;

  if (!priceId || !baseUrl) {
    console.warn("Onetime tool not configured: missing STRIPE_ONETIME_PRICE_ID or BASE_URL");
    return;
  }

  agent.paidTool(
    "onetime_feature",
    "A premium feature that requires a one-time payment. Purchase once and use forever.",
    { a: z.number(), b: z.number() },
    async ({ a, b }: { a: number; b: number }) => ({
      content: [{ type: "text", text: String(a + b) }],
    }),
    {
      checkout: {
        success_url: `${baseUrl}/payment/success`,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
      },
      paymentReason: PAYMENT_REASONS.ONETIME,
    }
  );
}
