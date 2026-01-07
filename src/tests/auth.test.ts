/**
 * Authentication tests
 */

import { describe, it, expect } from "vitest";
import {
  generateProtectedResourceMetadata,
  verifyBearerToken,
  createAuthenticateHeader,
  createUnauthorizedResponse,
} from "../auth/apps-sdk-oauth.js";

describe("OAuth", () => {
  describe("Protected Resource Metadata", () => {
    it("should generate valid metadata", () => {
      const env = {
        BASE_URL: "https://test.workers.dev",
        OAUTH_ISSUER: "https://auth.example.com",
      } as any;

      const metadata = generateProtectedResourceMetadata(env);

      expect(metadata.resource).toBe("https://test.workers.dev");
      expect(metadata.authorization_servers).toEqual(["https://auth.example.com"]);
      expect(metadata.scopes_supported).toEqual(["read", "write"]);
      expect(metadata.bearer_methods).toEqual(["header"]);
    });

    it("should use BASE_URL as issuer when OAUTH_ISSUER is not set", () => {
      const env = {
        BASE_URL: "https://test.workers.dev",
      } as any;

      const metadata = generateProtectedResourceMetadata(env);

      expect(metadata.authorization_servers).toEqual(["https://test.workers.dev"]);
    });
  });

  describe("Token Verification", () => {
    it("should reject missing authorization header", async () => {
      const env = { BASE_URL: "https://test.workers.dev" } as any;
      const result = await verifyBearerToken(null, env);
      expect(result).toBeNull();
    });

    it("should reject malformed authorization header", async () => {
      const env = { BASE_URL: "https://test.workers.dev" } as any;
      const result = await verifyBearerToken("InvalidFormat", env);
      expect(result).toBeNull();
    });

    it("should reject non-Bearer authorization header", async () => {
      const env = { BASE_URL: "https://test.workers.dev" } as any;
      const result = await verifyBearerToken("Basic dGVzdA==", env);
      expect(result).toBeNull();
    });
  });

  describe("WWW-Authenticate Header", () => {
    it("should create valid authenticate header without scopes", () => {
      const env = { BASE_URL: "https://test.workers.dev" } as any;
      const header = createAuthenticateHeader(env);
      expect(header).toContain('resource_metadata="https://test.workers.dev"');
    });

    it("should create valid authenticate header with scopes", () => {
      const env = { BASE_URL: "https://test.workers.dev" } as any;
      const header = createAuthenticateHeader(env, ["read", "write"]);
      expect(header).toContain('scope="read write"');
    });

    it("should create 401 response with WWW-Authenticate header", () => {
      const env = { BASE_URL: "https://test.workers.dev" } as any;
      const response = createUnauthorizedResponse(env);
      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toBeTruthy();
    });
  });
});
