/* src/routes/api/[...path]/+server.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { env } from "cloudflare:workers";

import type { RequestHandler } from "./$types";
import { app } from "#lib/server/plural/app.ts";
import { setRuntime } from "#lib/server/plural/runtime.ts";
import type { PluralEnv } from "#lib/server/plural/types.ts";

// Every method under /api goes to the Hono app
export const fallback: RequestHandler = async ({ request }) => {
  setRuntime(env as unknown as PluralEnv);
  return app.fetch(request);
};
