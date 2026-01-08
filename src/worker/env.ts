/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  // Durable Object for MCP server
  MCP_OBJECT: DurableObjectNamespace<MKitMCP>;

  // Assets binding for serving static files
  ASSETS: Fetcher;

  // KV namespace for OAuth state management
  OAUTH_KV: KVNamespace;

  // Base URLs
  BASE_URL: string;
  WIDGET_DOMAIN?: string;

  // OAuth 2.1 / Apps SDK configuration
  OAUTH_ISSUER?: string;
  OAUTH_JWKS_URI?: string;

  // Google OAuth credentials
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // GitHub OAuth credentials
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;

  // Cookie encryption
  COOKIE_ENCRYPTION_KEY?: string;

  // Stripe configuration
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_SUBSCRIPTION_PRICE_ID?: string;
  STRIPE_ONETIME_PRICE_ID?: string;
  STRIPE_METERED_PRICE_ID?: string;
}

// Forward declaration for Durable Object class
export type MKitMCP = import("./mcp.js").MKitMCP;
