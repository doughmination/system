/* src/lib/auth.svelte.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { UserResponse } from "doughmination-api/server";
import { client, readToken, writeToken } from "./api.ts";

// Who is signed in, shared by every page. Filled on the client only: the token lives in localStorage
class Auth {
  token = $state<string | null>(null);
  user = $state<UserResponse | null>(null);
  ready = $state(false);

  // mock-* tokens are for local development, as before
  isMock = $derived(this.token?.startsWith("mock-") ?? false);
  signedIn = $derived(this.isMock ? true : this.user !== null);
  isOwner = $derived(this.isMock ? this.token === "mock-owner" : Boolean(this.user?.is_owner));
  isAdmin = $derived(this.isMock ? this.token === "mock-admin" : Boolean(this.user?.is_admin));
  isPet = $derived(this.isMock ? this.token === "mock-pet" : Boolean(this.user?.is_pet));
  displayName = $derived(this.isMock ? "Mock User" : this.user?.display_name || this.user?.username || "");

  async load() {
    this.token = readToken();
    if (this.token && !this.isMock) await this.refresh();
    this.ready = true;
  }

  async refresh() {
    try {
      this.user = await client.getUserInfo();
    } catch {
      this.user = null;
    }
  }

  signIn(token: string) {
    writeToken(token);
    this.token = token;
    this.ready = false;
    void this.load();
  }

  /** Ends the API session too, and returns the SSO's logout page when there is one */
  async signOut(): Promise<string | null> {
    const current = this.token;
    writeToken(null);
    this.token = null;
    this.user = null;
    if (!current || this.isMock) return null;

    try {
      const response = await fetch(`${client.baseUrl}/plural/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${current}` },
      });
      const data = (await response.json()) as { end_session_url?: string | null };
      return data.end_session_url ?? null;
    } catch {
      // Offline or the API is down; the local sign-out still stands
      return null;
    }
  }
}

export const auth = new Auth();
