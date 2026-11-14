/* src/lib/server/plural/config.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { rt } from "./runtime";

export const JWT_ALGORITHM = "HS256" as const;

// 24 hours
export const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24;

// How long an in-flight authorization request (state + PKCE verifier) stays valid
export const OIDC_STATE_TTL_MINUTES = 10;

export function jwtSecret(): string {
  const secret = rt().env.JWT_SECRET;
  // Never sign with a guessable default in production
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function adminUsername(): string {
  return rt().env.ADMIN_USERNAME ?? "admin";
}

export function adminDisplayName(): string {
  return rt().env.ADMIN_DISPLAY_NAME ?? "Administrator";
}

// Backfilled onto the owner account on read when it has no email yet
export function adminEmail(): string | undefined {
  const value = rt().env.ADMIN_EMAIL?.trim().toLowerCase();
  return value || undefined;
}

export function frontendUrl(): string {
  return (rt().env.FRONTEND_URL ?? "https://doughmination.co.uk").replace(/\/+$/, "");
}

// ---- Doughmination SSO (OpenID Connect), the only login method ----

export function ssoIssuer(): string {
  return (rt().env.SSO_ISSUER ?? "").replace(/\/+$/, "");
}

export function ssoClientId(): string | undefined {
  return rt().env.SSO_CLIENT_ID;
}

export function ssoClientSecret(): string | undefined {
  return rt().env.SSO_CLIENT_SECRET;
}

export function ssoRedirectUri(): string {
  return rt().env.SSO_REDIRECT_URI ?? `${frontendUrl()}/api/plural/auth/sso/callback`;
}

export function ssoScopes(): string {
  return rt().env.SSO_SCOPES ?? "openid profile email offline_access";
}

// The token is appended in the URL fragment so it never hits a server log
export function ssoPostLoginUrl(): string {
  const configured = rt().env.SSO_POST_LOGIN_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return `${frontendUrl()}/user/login/callback`;
}

export function ssoLoginErrorUrl(): string {
  return `${frontendUrl()}/user/login`;
}

export function ssoPostLogoutRedirectUri(): string {
  return rt().env.SSO_POST_LOGOUT_REDIRECT_URI ?? `${frontendUrl()}/`;
}

// ---- CORS ----

// Local dev servers on any port are always allowed
export function isLocalhostOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}

export function corsOrigins(): string[] {
  const defaults = [
    "https://doughmination.co.uk",
    "https://doughmination.gay",
    "https://vibecoded.doughmination.gay",
    "https://www.doughmination.gay",
    "https://is.doughmination.gay",
    "https://c.stupid.cat",
  ];
  const extra = (rt().env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...defaults, ...extra])];
}
