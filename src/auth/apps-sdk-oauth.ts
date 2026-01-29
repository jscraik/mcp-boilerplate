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

export function getProtectedResourceMetadataUrl(env: Env): string {
  return new URL("/.well-known/oauth-protected-resource", env.BASE_URL).toString();
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
 * Extended JWK type with optional kid and alg fields
 */
interface JwkWithMetadata extends JsonWebKey {
  kid?: string;
  alg?: string;
}

// JWKS cache for token verification
let jwksCache: { keys: JwkWithMetadata[]; fetchedAt: number } | null = null;
const JWKS_CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Fetch and cache JWKS from the authorization server
 */
async function getJwks(jwksUri: string): Promise<JwkWithMetadata[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  const response = await fetch(jwksUri);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status}`);
  }

  const jwks = (await response.json()) as { keys: JwkWithMetadata[] };
  jwksCache = { keys: jwks.keys, fetchedAt: now };
  return jwks.keys;
}

/**
 * Import a JWK for verification
 */
async function importJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/**
 * Base64URL decode (JWT uses base64url, not standard base64)
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters and add padding
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
}

/**
 * Verify a Bearer token from the Authorization header
 * Uses JWKS for cryptographic signature verification
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

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT format: expected 3 parts");
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header to get key ID
    const header = JSON.parse(base64UrlDecode(headerB64)) as { kid?: string; alg: string };

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as TokenPayload;

    // Verify issuer
    const expectedIssuer = env.OAUTH_ISSUER || env.BASE_URL;
    if (payload.iss !== expectedIssuer) {
      console.warn("Token issuer mismatch:", payload.iss, "expected:", expectedIssuer);
      return null;
    }

    // Verify expiration
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      console.warn("Token expired");
      return null;
    }

    // Verify not-before
    if (payload.nbf && payload.nbf > now) {
      console.warn("Token not yet valid");
      return null;
    }

    // Verify signature using JWKS
    if (env.OAUTH_JWKS_URI) {
      const jwks = await getJwks(env.OAUTH_JWKS_URI);

      // Find the key by kid, or use the first RS256 key
      const jwk = header.kid
        ? jwks.find((k) => k.kid === header.kid)
        : jwks.find((k) => k.alg === "RS256" || k.kty === "RSA");

      if (!jwk) {
        console.warn("No matching JWK found for token verification");
        return null;
      }

      const key = await importJwk(jwk);

      // Verify signature
      const signatureBytes = Uint8Array.from(
        base64UrlDecode(signatureB64),
        (c) => c.charCodeAt(0)
      );
      const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

      const isValid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        key,
        signatureBytes,
        dataToVerify
      );

      if (!isValid) {
        console.warn("Token signature verification failed");
        return null;
      }
    } else {
      // No JWKS URI configured - log warning but allow in development
      console.warn(
        "OAUTH_JWKS_URI not configured - token signature not verified. " +
        "This is insecure and should only be used in development."
      );
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
  const scopeParam = scopes ? `, scope="${scopes.join(" ")}"` : "";

  return `Bearer resource_metadata="${getProtectedResourceMetadataUrl(env)}"${scopeParam}`;
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
