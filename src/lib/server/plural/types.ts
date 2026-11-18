/* src/lib/server/plural/types.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { LiveHub } from "./hub";

export interface PluralEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  // This site's own live socket hub (src/lib/server/plural/hub.ts)
  LIVE: DurableObjectNamespace<LiveHub>;

  // Secrets
  JWT_SECRET?: string;
  SSO_CLIENT_ID?: string;
  SSO_CLIENT_SECRET?: string;
  // Shared with proxyBot so it can switch without an SSO sign-in
  BOT_TOKEN?: string;

  // Vars
  SSO_ISSUER?: string;
  SSO_REDIRECT_URI?: string;
  SSO_SCOPES?: string;
  SSO_POST_LOGIN_URL?: string;
  SSO_POST_LOGOUT_REDIRECT_URI?: string;
  ADMIN_USERNAME?: string;
  ADMIN_DISPLAY_NAME?: string;
  ADMIN_EMAIL?: string;
  FRONTEND_URL?: string;
  CORS_ORIGINS?: string;
}

// Member, system and switch objects travel as loose JSON, as they did from PluralKit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonObject = Record<string, any>;
