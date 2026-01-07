/**
 * Paid tool: metered_feature
 * Uses metered/usage-based Stripe billing
 */

import { z } from "zod";
import type { experimental_PaidMcpAgent as PaidMcpAgent } from "@stripe/agent-toolkit/cloudflare";
import type { Env } from "../../worker/env.js";
import { PAYMENT_REASONS } from "../../billing/stripe.js";

export function registerMeteredTool(
  agent: PaidMcpAgent<Env, unknown, unknown>,
  env: Env
): void {
  const priceId = env.STRIPE_METERED_PRICE_ID;
  const baseUrl = env.BASE_URL;

  if (!priceId || !baseUrl) {
    console.warn("Metered tool not configured: missing STRIPE_METERED_PRICE_ID or BASE_URL");
    return;
  }

  agent.paidTool(
    "metered_feature",
    "A premium feature using metered billing. Your first 3 uses are free, then we charge 10 cents per use.",
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
          },
        ],
        mode: "subscription",
      },
      meterEvent: "metered_add_usage",
      paymentReason:
        "METER INFO: Your first 3 additions are free, then we charge 10 cents per addition. " +
        PAYMENT_REASONS.METERED,
    }
  );
}
