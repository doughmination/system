/* src/lib/api.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { DoughminationClient } from "doughmination-api/server";

const TOKEN_KEY = "token";

/** The API's JWT from the last SSO sign-in, kept where it always was */
export function readToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked; the session simply won't persist
  }
}

/** A client for load functions: SvelteKit's fetch, no token */
export function publicClient(fetcher: typeof fetch): DoughminationClient {
  return new DoughminationClient({ fetch: fetcher });
}

/** The browser's client: every request carries the current token */
export const client = new DoughminationClient({
  token: () => readToken(),
});

function apiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as {
      error?: { message?: string };
      detail?: string;
      message?: string;
    };
    return b.error?.message || b.detail || b.message || fallback;
  }
  return fallback;
}

/** For the endpoints the client has no method for. Throws with the API's own message */
export async function authFetch<T = unknown>(path: string, init: RequestInit = {}, fallback = "Request failed"): Promise<T> {
  const token = readToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${client.baseUrl}${path}`, {
    ...init,
    headers,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(apiErrorMessage(body, fallback));
  return body as T;
}
