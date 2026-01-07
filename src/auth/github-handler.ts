/**
 * GitHub OAuth handler for Cloudflare Workers OAuth Provider
 */

import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { Octokit } from "octokit";
import type { Env } from "../worker/env.js";
import { fetchUpstreamAuthToken, getUpstreamAuthorizeUrl, AuthProps } from "./oauth.js";
import { clientIdAlreadyApproved, parseRedirectApproval, renderApprovalDialog } from "./workers-oauth-utils.js";

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const { clientId } = oauthReqInfo;
  if (!clientId) {
    return c.text("Invalid request", 400);
  }

  if (
    await clientIdAlreadyApproved(
      c.req.raw,
      oauthReqInfo.clientId,
      c.env.COOKIE_ENCRYPTION_KEY || "default-secret"
    )
  ) {
    return redirectToGithub(c.req.raw, oauthReqInfo, c.env.GITHUB_CLIENT_ID);
  }

  return renderApprovalDialog(c.req.raw, {
    client: await c.env.OAUTH_PROVIDER.lookupClient(clientId),
    server: {
      provider: "github",
      name: "MCP Boilerplate",
      logo: "https://avatars.githubusercontent.com/u/314135?s=200&v=4",
      description:
        "This is a boilerplate MCP that you can use to build your own remote MCP server, with Stripe integration for paid tools and Google/GitHub authentication.",
    },
    state: { oauthReqInfo },
  });
});

app.post("/authorize", async (c) => {
  const { state, headers } = await parseRedirectApproval(
    c.req.raw,
    c.env.COOKIE_ENCRYPTION_KEY || "default-secret"
  );
  if (!state.oauthReqInfo) {
    return c.text("Invalid request", 400);
  }

  return redirectToGithub(c.req.raw, state.oauthReqInfo, c.env.GITHUB_CLIENT_ID, headers);
});

async function redirectToGithub(
  request: Request,
  oauthReqInfo: AuthRequest,
  githubClientId: string | undefined,
  headers: Record<string, string> = {}
) {
  return new Response(null, {
    status: 302,
    headers: {
      ...headers,
      location: getUpstreamAuthorizeUrl({
        upstream_url: "https://github.com/login/oauth/authorize",
        scope: "read:user",
        client_id: githubClientId || "",
        redirect_uri: new URL("/callback/github", request.url).href,
        state: btoa(JSON.stringify(oauthReqInfo)),
      }),
    },
  });
}

app.get("/callback/github", async (c) => {
  const oauthReqInfo = JSON.parse(atob(c.req.query("state") || "")) as AuthRequest;
  if (!oauthReqInfo.clientId) {
    return c.text("Invalid state", 400);
  }

  const [accessToken, errResponse] = await fetchUpstreamAuthToken({
    upstream_url: "https://github.com/login/oauth/access_token",
    client_id: c.env.GITHUB_CLIENT_ID || "",
    client_secret: c.env.GITHUB_CLIENT_SECRET || "",
    code: c.req.query("code"),
    redirect_uri: new URL("/callback/github", c.req.url).href,
  });
  if (errResponse) return errResponse;

  const user = await new Octokit({ auth: accessToken }).rest.users.getAuthenticated();
  const { login, name, email } = user.data;

  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId: login,
    metadata: {
      label: name,
    },
    scope: oauthReqInfo.scope,
    props: {
      login,
      name,
      email,
      accessToken,
      userEmail: email,
    } as AuthProps,
  });

  return Response.redirect(redirectTo);
});

export { app as GitHubHandler };
