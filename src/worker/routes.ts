/**
 * HTTP Router for the MCP worker
 * Handles /mcp, OAuth endpoints, and webhooks
 */

import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import type { Env } from "./env.js";
import { BoilerplateMCP } from "./mcp.js";
import { GoogleHandler } from "../auth/google-handler.js";
import { GitHubHandler } from "../auth/github-handler.js";
import { serveProtectedResourceMetadata } from "../auth/apps-sdk-oauth.js";
import StripeWebhookWorker from "../billing/webhooks.js";

/**
 * Route handler for Cloudflare Workers
 */
export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Protected resource metadata endpoint (OAuth 2.1 compliance)
  if (path === "/.well-known/oauth-protected-resource") {
    return serveProtectedResourceMetadata(env);
  }

  // OAuth provider setup (Google/GitHub login)
  const oauthProvider = new OAuthProvider({
    apiRoute: "/mcp",
    apiHandler: BoilerplateMCP.mount("/mcp") as any,
    defaultHandler: GoogleHandler as any,
    authorizeEndpoint: "/authorize",
    tokenEndpoint: "/token",
    clientRegistrationEndpoint: "/register",
  });

  // Add OAUTH_PROVIDER to environment for handlers
  const envWithProvider = { ...env, OAUTH_PROVIDER: oauthProvider } as Env & {
    OAUTH_PROVIDER: typeof oauthProvider;
  };

  // OAuth authorize endpoints (Google/GitHub)
  if (path === "/authorize/google") {
    return GoogleHandler.fetch(request, envWithProvider, ctx);
  }
  if (path === "/authorize/github") {
    return GitHubHandler.fetch(request, envWithProvider, ctx);
  }

  // OAuth callback endpoints
  if (path === "/callback/google") {
    return GoogleHandler.fetch(request, envWithProvider, ctx);
  }
  if (path === "/callback/github") {
    return GitHubHandler.fetch(request, envWithProvider, ctx);
  }

  // Stripe webhooks
  if (path === "/webhooks/stripe") {
    return StripeWebhookWorker.fetch(request, env);
  }

  // MCP endpoint (streaming HTTP)
  if (path === "/mcp") {
    return BoilerplateMCP.mount("/mcp").fetch(request, env, ctx);
  }

  // Payment success page redirect
  if (path === "/payment/success") {
    return Response.redirect(`${env.BASE_URL}/payment-success.html`, 302);
  }

  // Serve static assets
  return env.ASSETS.fetch(request);
}

export default { fetch: handleRequest };
