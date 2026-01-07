/**
 * Apps SDK OAuth 2.1 Compliance
 *
 * Implements OAuth 2.1 protected resource metadata endpoint
 * and provides token verification utilities for ChatGPT Apps.
 */

import type { Env } from "../worker/env.js";

/**
 * Protected resource metadata response
 * Per RFC 9728 and OpenAI Apps SDK requirements
 */
export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  resource_documentation?: string;
  bearer_methods?: ["header"];
  token_endpoint_auth_methods_supported?: string[];
}

/**
 * Generate protected resource metadata for this MCP server
 */
export function generateProtectedResourceMetadata(env: Env): ProtectedResourceMetadata {
  const baseUrl = env.BASE_URL;
  const issuer = env.OAUTH_ISSUER || baseUrl;

  return {
    resource: baseUrl,
    authorization_servers: [issuer],
    scopes_supported: ["read", "write"],
    resource_documentation: `${baseUrl}/docs`,
    bearer_methods: ["header"],
  };
}

/**
 * Serve the protected resource metadata endpoint
 * GET /.well-known/oauth-protected-resource
 */
export function serveProtectedResourceMetadata(env: Env): Response {
  const metadata = generateProtectedResourceMetadata(env);

  return new Response(JSON.stringify(metadata, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/**
 * Token verification utilities
 * In production, you would verify JWT tokens using JWKS
 */

export interface TokenPayload {
  sub: string;
  iss: string;
  aud?: string;
  exp: number;
  nbf?: number;
  scope?: string;
}

/**
 * Verify a Bearer token from the Authorization header
 * This is a simplified version - production should use JWKS verification
 */
export async function verifyBearerToken(
  authorizationHeader: string | null,
  env: Env
): Promise<TokenPayload | null> {
  if (!authorizationHeader) {
    return null;
  }

  // Extract Bearer token
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return null;
  }

  const token = match[1];

  // In production, verify JWT signature using JWKS from OAUTH_JWKS_URI
  // For now, this is a placeholder that accepts tokens for development
  try {
    // Simple base64 decode for testing (NOT SECURE for production)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1])) as TokenPayload;

    // Verify issuer
    const expectedIssuer = env.OAUTH_ISSUER || env.BASE_URL;
    if (payload.iss !== expectedIssuer) {
      console.warn("Token issuer mismatch:", payload.iss, expectedIssuer);
      return null;
    }

    // Verify expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.warn("Token expired");
      return null;
    }

    return payload;
  } catch (e) {
    console.error("Token verification error:", e);
    return null;
  }
}

/**
 * Create a WWW-Authenticate header for 401 responses
 * Prompts the client to authenticate using OAuth
 */
export function createAuthenticateHeader(env: Env, scopes?: string[]): string {
  const metadata = generateProtectedResourceMetadata(env);
  const scopeParam = scopes ? `, scope="${scopes.join(" ")}"` : "";

  return `Bearer resource_metadata="${metadata.resource}"${scopeParam}`;
}

/**
 * Create a 401 Unauthorized response with proper auth headers
 */
export function createUnauthorizedResponse(env: Env, scopes?: string[]): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": createAuthenticateHeader(env, scopes),
    },
  });
}
