/* src/lib/server/plural/routes/auth.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

// Doughmination SSO (OpenID Connect) is the only login.
// Native apps start with ?app=<S256 challenge>, get a one-time code back on
// gay.doughmination.plural://auth, and swap it at /auth/app/token with their verifier.
// /auth/pocketid/* stay as aliases because the published client still builds those URLs.

import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { Env } from "../hono";
import { router, ok, jsonBody, signedIn } from "../openapi";
import { UserSchema } from "../schemas";
import { toUserResponse, type User } from "../models";
import { findOrCreateFromSso } from "../services/users";
import { beginLogin, completeLogin, endSessionUrl, isAppLogin, revokeRefreshToken } from "../services/oidc";
import { APP_CODE, PKCE_CHALLENGE, PKCE_VERIFIER, saveAppCode, takeAppCode } from "../services/app_codes";
import { createSsoSession, endSsoSession } from "../services/sso_sessions";
import { ssoPostLoginUrl, ssoLoginErrorUrl, ACCESS_TOKEN_EXPIRE_MINUTES } from "../config";
import { createAccessToken, decodeAccessToken } from "../security";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../errors";

export const authRoutes = router();

// Where an app-started login lands; the Plural Android app handles this scheme
const APP_REDIRECT = "gay.doughmination.plural://auth";

// Only a path starting with a single "/" — never "//host", "/\host" or a full URL
function safeReturnPath(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

function loginError(c: Context<Env>, message: string, app = false) {
  const url = new URL(app ? APP_REDIRECT : ssoLoginErrorUrl());
  url.searchParams.set("error", message);
  return c.redirect(url.toString(), 302);
}

async function login(c: Context<Env>) {
  const from = safeReturnPath(c.req.query("from"));
  const app = c.req.query("app");
  if (app !== undefined && !PKCE_CHALLENGE.test(app)) {
    throw new HttpError(400, "'app' must be an S256 PKCE challenge.");
  }
  return c.redirect(await beginLogin(from, app), 302);
}

async function callback(c: Context<Env>) {
  const code = c.req.query("code");
  const state = c.req.query("state");
  // Errors go back to whoever started the login: the app or the website
  const app = await isAppLogin(state);

  const errorParam = c.req.query("error");
  if (errorParam === "access_denied") {
    return loginError(c, "Your SSO account isn't allowed to use this site.", app);
  }
  if (errorParam) return loginError(c, errorParam, app);
  if (!code || !state) return loginError(c, "missing_code", app);

  let result;
  try {
    result = await completeLogin(code, state, c.req.query("iss"));
  } catch (err) {
    return loginError(c, err instanceof Error ? err.message : "Login failed. Please try again.", app);
  }

  const { identity, tokens, from, appChallenge } = result;

  let user: User;
  try {
    user = await findOrCreateFromSso({
      sub: identity.sub,
      issuer: identity.issuer,
      username: identity.preferredUsername,
      email: identity.email,
      displayName: identity.displayName,
    });
  } catch (err) {
    return loginError(c, err instanceof Error ? err.message : "Could not sign you in.", app);
  }

  const expiresAt = Date.now() + ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000;
  const sid = await createSsoSession(user, tokens, expiresAt);

  const token = await createAccessToken({
    sub: user.username,
    id: user.id,
    sid,
    display_name: user.display_name,
    admin: user.is_admin,
    owner: user.is_owner,
    pet: user.is_pet,
    avatar_url: user.avatar_url ?? null,
  });

  // An app gets a one-time code, never the token: any app can claim a custom scheme
  if (appChallenge) {
    const appCode = await saveAppCode(token, appChallenge);
    return c.redirect(`${APP_REDIRECT}?code=${encodeURIComponent(appCode)}`, 302);
  }

  // The fragment never reaches a server log or the Referer header
  const dest = new URL(ssoPostLoginUrl());
  dest.hash = `token=${encodeURIComponent(token)}&from=${encodeURIComponent(from)}`;
  return c.redirect(dest.toString(), 302);
}

const redirect = {
  302: {
    description: "Redirect",
  },
};

const LoginQuery = z.object({
  from: z.string().optional().openapi({ description: "Site path to return to after signing in" }),
  app: z.string().optional().openapi({ description: "S256 PKCE challenge, for native apps only" }),
});

for (const path of ["/auth/sso/login", "/auth/pocketid/login"]) {
  authRoutes.openapi(
    createRoute({
      method: "get",
      path,
      tags: ["Auth"],
      summary: "Start an SSO sign-in",
      request: {
        query: LoginQuery,
      },
      responses: redirect,
    }),
    login as never,
  );
}

for (const path of ["/auth/sso/callback", "/auth/pocketid/callback"]) {
  authRoutes.openapi(
    createRoute({
      method: "get",
      path,
      tags: ["Auth"],
      summary: "Where the SSO sends the browser back",
      responses: redirect,
    }),
    callback as never,
  );
}

authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/auth/app/token",
    tags: ["Auth"],
    summary: "A native app swaps its one-time code and PKCE verifier for a token",
    request: jsonBody(
      z.object({
        code: z.string().regex(APP_CODE),
        verifier: z.string().regex(PKCE_VERIFIER),
      }),
    ),
    responses: ok(
      z.object({
        access_token: z.string(),
        token_type: z.literal("bearer"),
      }),
    ),
  }),
  async (c) => {
    const { code, verifier } = c.req.valid("json");
    const token = await takeAppCode(code, verifier);
    c.header("Cache-Control", "no-store");
    if (!token) throw new HttpError(400, "That sign-in code is invalid or has expired. Please sign in again.");
    return c.json({ access_token: token, token_type: "bearer" as const }, 200);
  },
);

// Accepts an expired token, so a stale tab can still sign out cleanly
authRoutes.openapi(
  createRoute({
    method: "post",
    path: "/auth/logout",
    tags: ["Auth"],
    summary: "End the session here, and get the SSO's logout URL",
    security: signedIn,
    responses: ok(
      z.object({
        ok: z.boolean(),
        end_session_url: z.string().nullable(),
      }),
    ),
  }),
  async (c) => {
    const header = c.req.header("Authorization") ?? "";
    const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

    let sid: string | null = null;
    if (token) {
      try {
        const payload = await decodeAccessToken(token, { allowExpired: true });
        sid = typeof payload.sid === "string" ? payload.sid : null;
      } catch {
        // Unverifiable token: nothing of ours to end
      }
    }

    const session = sid ? await endSsoSession(sid) : null;
    if (session?.refreshToken) {
      await revokeRefreshToken(session.refreshToken).catch((err) =>
        console.warn(`SSO refresh token revocation failed: ${String(err)}`),
      );
    }

    let endSession: string | null = null;
    try {
      endSession = await endSessionUrl(session?.idToken ?? null);
    } catch {
      // SSO unreachable; the local session is gone regardless
    }
    return c.json({ ok: true, end_session_url: endSession }, 200);
  },
);

authRoutes.openapi(
  createRoute({
    method: "get",
    path: "/user_info",
    tags: ["Auth"],
    summary: "The signed-in account",
    security: signedIn,
    middleware: [requireAuth] as const,
    responses: ok(UserSchema),
  }),
  (c) => c.json(toUserResponse(c.get("user") as User), 200),
);

for (const [path, key, role] of [
  ["/auth/is_admin", "isAdmin", "is_admin"],
  ["/auth/is_pet", "isPet", "is_pet"],
  ["/auth/is_owner", "isOwner", "is_owner"],
] as const) {
  authRoutes.openapi(
    createRoute({
      method: "get",
      path,
      tags: ["Auth"],
      summary: `Whether the signed-in account has ${role}`,
      security: signedIn,
      middleware: [requireAuth] as const,
      responses: ok(z.record(z.string(), z.boolean())),
    }),
    (c) => c.json({ [key]: Boolean(c.get("user")?.[role]) }, 200),
  );
}
