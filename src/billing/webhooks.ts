/**
 * Stripe webhook handler
 */

import Stripe from "stripe";
import type { Env } from "../worker/env.js";
import { createStripeClient } from "./stripe.js";

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST" || new URL(request.url).pathname !== "/webhooks/stripe") {
    return new Response("Not found", { status: 404 });
  }

  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    console.error("Missing required Stripe environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No Stripe signature found", { status: 400 });
    }

    const stripe = createStripeClient(env);

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Received Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Payment completed for session: ${session.id}`);
        console.log(`Customer: ${session.customer}`);
        console.log(`Payment status: ${session.payment_status}`);

        // In production: Update user's entitlement in database
        // e.g., await db.users.update(userId, { hasPremium: true });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription event: ${event.type}`);
        console.log(`Subscription ID: ${subscription.id}`);
        console.log(`Customer: ${subscription.customer}`);
        console.log(`Status: ${subscription.status}`);

        // In production: Update subscription status in database
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice event: ${event.type}`);
        console.log(`Invoice ID: ${invoice.id}`);
        console.log(`Customer: ${invoice.customer}`);
        console.log(`Amount paid: ${invoice.amount_paid}`);

        // Handle successful or failed payments
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook error:", error);

    if (error instanceof Error && (error as any).type === "StripeSignatureVerificationError") {
      return new Response(
        "Webhook signature verification failed. Check that your STRIPE_WEBHOOK_SECRET matches the signing secret in your Stripe dashboard.",
        { status: 400 }
      );
    }

    return new Response(`Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 400,
    });
  }
}

/**
 * Export as a worker module
 */
export default {
  fetch: (request: Request, env: Env) => handleStripeWebhook(request, env),
};
