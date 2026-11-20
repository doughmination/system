/* src/lib/api.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type {
  FrontersResponse,
  MemberStatusResponse,
  MentalState,
  PluralMember,
  PluralSystem,
  RelationshipsResponse,
  SwitchResponse,
  UserResponse,
} from "./types.ts";
import { siteUrl } from "./index.ts";

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

// The API lives on this site, at /api
export function apiBase(origin: string): string {
  return `${origin}/api`;
}

// Live updates come from this site's own hub
export const socketUrl = "wss://doughmination.co.uk/api/plural/ws";

/** A client for load functions: SvelteKit's fetch, no token */
export function publicClient(fetcher: typeof fetch, origin: string): SiteClient {
  return new SiteClient({
    fetch: fetcher,
    baseUrl: apiBase(origin),
  });
}

function apiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as {
      error?: string | { message?: string };
      detail?: string | { message?: string }[];
      message?: string;
    };
    if (typeof b.error === "string") return b.error;
    // Validation errors arrive as a list of issues
    if (Array.isArray(b.detail)) return b.detail.map((issue) => issue.message).join("; ");
    return b.error?.message || b.detail || b.message || fallback;
  }
  return fallback;
}

interface ClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  token?: () => string | null;
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signedIn?: boolean;
}

// This site's API, with only the calls the pages use
export class SiteClient {
  readonly baseUrl: string;
  private readonly doFetch: typeof fetch;
  private readonly token: () => string | null;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.doFetch = (options.fetch ?? fetch).bind(globalThis);
    this.token = options.token ?? (() => null);
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers();
    if (options.body !== undefined) headers.set("Content-Type", "application/json");

    if (options.signedIn) {
      const token = this.token();
      if (!token) throw new Error("Sign in first");
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await this.doFetch(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const fallback = typeof parsed === "string" && parsed ? parsed : `Request failed with ${response.status}`;
      throw new Error(apiErrorMessage(parsed, fallback));
    }
    return parsed as T;
  }

  getFronters() {
    return this.request<FrontersResponse>("/plural/fronters");
  }

  getMembers() {
    return this.request<PluralMember[]>("/plural/members");
  }

  getMember(memberId: string) {
    return this.request<PluralMember>(`/plural/member/${encodeURIComponent(memberId)}`);
  }

  getSystem() {
    return this.request<PluralSystem>("/plural/system");
  }

  getMentalState() {
    return this.request<MentalState>("/plural/mental-state");
  }

  getMemberStatus(identifier: string) {
    return this.request<MemberStatusResponse>(`/plural/members/${encodeURIComponent(identifier)}/status`);
  }

  getRelationships() {
    return this.request<RelationshipsResponse>("/plural/relationships");
  }

  loginUrl(from?: string): string {
    const url = new URL(`${this.baseUrl}/plural/auth/sso/login`);
    if (from) url.searchParams.set("from", from);
    return url.toString();
  }

  getUserInfo() {
    return this.request<UserResponse>("/plural/user_info", {
      signedIn: true,
    });
  }

  multiSwitch(memberIds: string[]) {
    return this.request<SwitchResponse>("/plural/multi_switch", {
      method: "POST",
      signedIn: true,
      body: {
        member_ids: memberIds,
      },
    });
  }

  setMentalState(input: { level: string; notes?: string }) {
    return this.request<unknown>("/plural/mental-state", {
      method: "POST",
      signedIn: true,
      body: {
        level: input.level,
        notes: input.notes ?? null,
      },
    });
  }

  setMemberStatus(identifier: string, input: { text: string; emoji?: string }) {
    return this.request<unknown>(`/plural/members/${encodeURIComponent(identifier)}/status`, {
      method: "POST",
      signedIn: true,
      body: {
        text: input.text,
        emoji: input.emoji ?? null,
      },
    });
  }

  forceRefresh() {
    return this.request<unknown>("/plural/admin/refresh", {
      method: "POST",
      signedIn: true,
    });
  }

  addMemberPride(identifier: string, identity: string) {
    return this.request<unknown>(`/plural/member-pride/${encodeURIComponent(identifier)}/add`, {
      method: "POST",
      signedIn: true,
      body: {
        identity,
      },
    });
  }

  removeMemberPride(identifier: string, identity: string) {
    const path = `/plural/member-pride/${encodeURIComponent(identifier)}/${encodeURIComponent(identity)}`;
    return this.request<unknown>(path, {
      method: "DELETE",
      signedIn: true,
    });
  }

  addRelationship(input: { memberA: string; memberB: string; type?: string; since?: string | null }) {
    return this.request<unknown>("/plural/relationships", {
      method: "POST",
      signedIn: true,
      body: {
        memberA: input.memberA,
        memberB: input.memberB,
        ...(input.type ? { type: input.type } : {}),
        ...(input.since !== undefined ? { since: input.since } : {}),
      },
    });
  }

  removeRelationship(id: string) {
    return this.request<unknown>(`/plural/relationships/${encodeURIComponent(id)}`, {
      method: "DELETE",
      signedIn: true,
    });
  }
}

/** The browser's client: every request carries the current token */
export const client = new SiteClient({
  baseUrl: apiBase(typeof location === "undefined" ? siteUrl : location.origin),
  token: () => readToken(),
});

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
