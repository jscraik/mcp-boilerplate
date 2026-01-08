/**
 * OAuth utilities for Cloudflare Workers OAuth Provider
 * Handles approval dialogs, cookie signing, and client approval tracking
 */

import type { AuthRequest, ClientInfo } from "@cloudflare/workers-oauth-provider";

const COOKIE_NAME = "mkit-clients";
const ONE_YEAR_IN_SECONDS = 31536000;

// --- Helper Functions ---

function decodeState<T = unknown>(encoded: string): T {
  try {
    const jsonString = atob(encoded);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Error decoding state:", e);
    throw new Error("Could not decode state");
  }
}

async function importKey(secret: string): Promise<CryptoKey> {
  if (!secret) {
    throw new Error("COOKIE_SECRET is not defined. A secret key is required for signing cookies.");
  }
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function signData(key: CryptoKey, data: string): Promise<string> {
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySignature(key: CryptoKey, signatureHex: string, data: string): Promise<boolean> {
  const enc = new TextEncoder();
  try {
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16))
    );
    return await crypto.subtle.verify("HMAC", key, signatureBytes.buffer, enc.encode(data));
  } catch (e) {
    console.error("Error verifying signature:", e);
    return false;
  }
}

async function getApprovedClientsFromCookie(
  cookieHeader: string | null,
  secret: string
): Promise<string[] | null> {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const targetCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!targetCookie) return null;

  const cookieValue = targetCookie.substring(COOKIE_NAME.length + 1);
  const parts = cookieValue.split(".");

  if (parts.length !== 2) {
    console.warn("Invalid cookie format received.");
    return null;
  }

  const [signatureHex, base64Payload] = parts;
  const payload = atob(base64Payload);

  const key = await importKey(secret);
  const isValid = await verifySignature(key, signatureHex, payload);

  if (!isValid) {
    console.warn("Cookie signature verification failed.");
    return null;
  }

  try {
    const approvedClients = JSON.parse(payload);
    if (!Array.isArray(approvedClients)) {
      console.warn("Cookie payload is not an array.");
      return null;
    }
    if (!approvedClients.every((item) => typeof item === "string")) {
      console.warn("Cookie payload contains non-string elements.");
      return null;
    }
    return approvedClients as string[];
  } catch (e) {
    console.error("Error parsing cookie payload:", e);
    return null;
  }
}

// --- Exported Functions ---

export async function clientIdAlreadyApproved(
  request: Request,
  clientId: string,
  cookieSecret: string
): Promise<boolean> {
  if (!clientId) return false;
  const cookieHeader = request.headers.get("Cookie");
  const approvedClients = await getApprovedClientsFromCookie(cookieHeader, cookieSecret);

  return approvedClients?.includes(clientId) ?? false;
}

export interface ApprovalDialogOptions {
  client: ClientInfo | null;
  server: {
    provider: string;
    name: string;
    logo?: string;
    description?: string;
  };
  state: Record<string, unknown>;
  cookieName?: string;
  cookieSecret?: string | Uint8Array;
  cookieDomain?: string;
  cookiePath?: string;
  cookieMaxAge?: number;
}

export function renderApprovalDialog(request: Request, options: ApprovalDialogOptions): Response {
  const { client, server, state } = options;

  const encodedState = btoa(JSON.stringify(state));

  const serverName = sanitizeHtml(server.name);
  const clientName = client?.clientName ? sanitizeHtml(client.clientName) : "Unknown MCP Client";
  const serverDescription = server.description ? sanitizeHtml(server.description) : "";

  const titleCasedProvider =
    typeof server.provider === "string" && server.provider
      ? server.provider
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-")
      : "Provider";

  const logoUrl = server.logo ? sanitizeHtml(server.logo) : "";
  const clientUri = client?.clientUri ? sanitizeHtml(client.clientUri) : "";
  const policyUri = client?.policyUri ? sanitizeHtml(client.policyUri) : "";
  const tosUri = client?.tosUri ? sanitizeHtml(client.tosUri) : "";

  const contacts = client?.contacts && client.contacts.length > 0 ? sanitizeHtml(client.contacts.join(", ")) : "";

  const redirectUris =
    client?.redirectUris && client.redirectUris.length > 0
      ? client.redirectUris.map((uri) => sanitizeHtml(uri))
      : [];

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${clientName} | Authorization Request</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }</style>
      </head>
      <body class="bg-slate-50 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 antialiased">
        <div class="w-full max-w-lg">
          <div class="text-center mb-8">
            ${logoUrl ? `<img src="${logoUrl}" alt="${serverName} Logo" class="mx-auto h-16 w-16 mb-4 rounded-lg object-contain text-gray-800 fill-white">` : ""}
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">${serverName}</h1>
            ${serverDescription ? `<p class="mt-2 text-lg text-gray-600">${serverDescription}</p>` : ""}
          </div>

          <div class="mt-7 bg-white border border-gray-200 rounded-xl shadow-2xs">
            <div class="p-5 sm:p-7">
              <div class="text-center">
                <h2 class="block text-xl sm:text-2xl font-bold text-gray-800">${clientName || "A new MCP Client"} is requesting access</h2>
              </div>

              <div class="mt-6 space-y-1">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pt-3 border-t border-gray-200">Application Details</h3>
                <div class="flow-root">
                    <ul role="list" class="-my-2 divide-y divide-gray-100">
                        <li class="flex items-start py-3">
                            <p class="w-1/3 text-sm font-medium text-gray-700 shrink-0">Name</p>
                            <p class="w-2/3 text-sm text-gray-600 break-words">${clientName}</p>
                        </li>
                        ${clientUri
      ? `
                        <li class="flex items-start py-3">
                            <p class="w-1/3 text-sm font-medium text-gray-700 shrink-0">Website</p>
                            <a href="${clientUri}" target="_blank" rel="noopener noreferrer" class="w-2/3 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium truncate">${clientUri}</a>
                        </li>`
      : ""
    }
                        ${policyUri
      ? `
                        <li class="flex items-start py-3">
                            <p class="w-1/3 text-sm font-medium text-gray-700 shrink-0">Privacy Policy</p>
                            <a href="${policyUri}" target="_blank" rel="noopener noreferrer" class="w-2/3 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium">${policyUri}</a>
                        </li>`
      : ""
    }
                        ${tosUri
      ? `
                        <li class="flex items-start py-3">
                            <p class="w-1/3 text-sm font-medium text-gray-700 shrink-0">Terms of Service</p>
                            <a href="${tosUri}" target="_blank" rel="noopener noreferrer" class="w-2/3 text-sm text-blue-600 decoration-2 hover:underline focus:outline-none focus:underline font-medium">${tosUri}</a>
                        </li>`
      : ""
    }
                        ${redirectUris.length > 0
      ? `
                        <li class="flex items-start py-3">
                            <p class="w-1/3 text-sm font-medium text-gray-700 shrink-0">Redirect URIs</p>
                            <div class="w-2/3 text-sm text-gray-600 space-y-1 break-words">
                                ${redirectUris.map((uri) => `<div>${uri}</div>`).join("")}
                            </div>
                        </li>`
      : ""
    }
                        ${contacts
      ? `
                        <li class="flex items-start py-3">
                            <p class="w-1/3 text-sm font-medium text-gray-700 shrink-0">Contact</p>
                            <p class="w-2/3 text-sm text-gray-600 break-words">${contacts}</p>
                        </li>`
      : ""
    }
                    </ul>
                </div>
              </div>

              <p class="mt-6 text-sm text-center text-gray-500">
                This MCP Client is requesting to be authorized on <strong>${serverName}</strong>.
                If you approve, you will be redirected to complete authentication.
              </p>

              <form method="post" action="${new URL(request.url).pathname}" class="mt-6">
                <input type="hidden" name="state" value="${encodedState}">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button type="button" onclick="window.history.back()" class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
                    Cancel
                  </button>
                  <button type="submit" class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">
                    Login with ${titleCasedProvider}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="text-center mt-6">
            <p class="text-xs text-gray-600">
              User privacy is important. Ensure you trust this application before approving access to your data.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  return new Response(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export interface ParsedApprovalResult {
  state: unknown;
  headers: Record<string, string>;
}

export async function parseRedirectApproval(
  request: Request,
  cookieSecret: string
): Promise<ParsedApprovalResult> {
  if (request.method !== "POST") {
    throw new Error("Invalid request method. Expected POST.");
  }

  let state: unknown;
  let clientId: string | undefined;

  try {
    const formData = await request.formData();
    const encodedState = formData.get("state");

    if (typeof encodedState !== "string" || !encodedState) {
      throw new Error("Missing or invalid 'state' in form data.");
    }

    state = decodeState(encodedState);
    const decodedState = state as { oauthReqInfo?: AuthRequest };
    clientId = decodedState?.oauthReqInfo?.clientId;

    if (!clientId) {
      throw new Error("Could not extract clientId from state object.");
    }
  } catch (e) {
    console.error("Error processing form submission:", e);
    throw new Error(`Failed to parse approval form: ${e instanceof Error ? e.message : String(e)}`);
  }

  const cookieHeader = request.headers.get("Cookie");
  const existingApprovedClients = (await getApprovedClientsFromCookie(cookieHeader, cookieSecret)) || [];

  const updatedApprovedClients = Array.from(new Set([...existingApprovedClients, clientId]));

  const payload = JSON.stringify(updatedApprovedClients);
  const key = await importKey(cookieSecret);
  const signature = await signData(key, payload);
  const newCookieValue = `${signature}.${btoa(payload)}`;

  const headers: Record<string, string> = {
    "Set-Cookie": `${COOKIE_NAME}=${newCookieValue}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${ONE_YEAR_IN_SECONDS}`,
  };

  return { state, headers };
}

function sanitizeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
