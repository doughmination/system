/* src/lib/server/plural/hono.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { Hono } from "hono";
import type { User } from "./models";

/** Variables carried on the Hono context (set by auth middleware). */
export type Variables = {
  user?: User;
};

export type Env = { Variables: Variables };
export type App = Hono<Env>;
