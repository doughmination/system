/* src/lib/server/plural/app.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

import type { Env } from "./hono";
import { HttpError } from "./errors";
import { corsOrigins, isLocalhostOrigin } from "./config";
import { initializeAdminUser } from "./services/users";
import { importLegacyStore } from "./services/importer";
import { rt } from "./runtime";

import { authRoutes } from "./routes/auth";
import { systemRoutes } from "./routes/system";
import { membersRoutes } from "./routes/members";
import { memberStatusRoutes } from "./routes/member_status";
import { relationshipsRoutes } from "./routes/relationships";
import { frontingRoutes } from "./routes/fronting";
import { usersRoutes } from "./routes/users";
import { metricsRoutes } from "./routes/metrics";
import { adminRoutes } from "./routes/admin";
import { botRoutes } from "./routes/bot";

// First run on an empty database: copy users and sessions from the old api Worker,
// so people stay signed in. Otherwise seed the owner. Once per isolate
let seeded = false;
async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;
  try {
    if ((await rt().store.get<unknown[]>("users", [])).length === 0) {
      await importLegacyStore().catch((err) => console.warn(`Legacy import skipped: ${String(err)}`));
    }
    await initializeAdminUser();
  } catch (err) {
    seeded = false;
    console.error(`Admin seed failed: ${String(err)}`);
  }
}

const plural = new OpenAPIHono<Env>();
plural.route("/", authRoutes);
plural.route("/", systemRoutes);
plural.route("/", membersRoutes);
plural.route("/", memberStatusRoutes);
plural.route("/", relationshipsRoutes);
plural.route("/", frontingRoutes);
plural.route("/", usersRoutes);
plural.route("/", metricsRoutes);
plural.route("/", adminRoutes);
plural.route("/", botRoutes);

export const app = new OpenAPIHono<Env>().basePath("/api");

app.use(
  "*",
  cors({
    origin: (origin) => (isLocalhostOrigin(origin) || corsOrigins().includes(origin) ? origin : ""),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("*", async (_c, next) => {
  await ensureSeeded();
  await next();
});

app.onError((err, c) => {
  if (err instanceof HttpError) {
    for (const [name, value] of Object.entries(err.headers ?? {})) c.header(name, value);
    return c.json({ detail: err.message }, err.statusCode as never);
  }
  console.error("Unhandled error:", err);
  return c.json({ detail: "Internal server error" }, 500);
});

app.route("/plural", plural);

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "The token from an SSO sign-in (24 hours). Some routes also need the admin, owner or pet role",
});

app.openAPIRegistry.registerComponent("securitySchemes", "botAuth", {
  type: "http",
  scheme: "bearer",
  description: "The DOUGH_BOT_TOKEN secret, sent with a 'User-Agent: CloveShortcuts/<version>' header",
});

app.doc31("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Doughmination System API",
    version: "3.0.0",
    description:
      "The plural system behind doughmination.co.uk. Live updates (fronters_update, mental_state_update, force_refresh) " +
      "arrive on the WebSocket at wss://doughmination.uk/v2/ws.",
  },
  servers: [
    {
      url: "https://doughmination.co.uk",
    },
  ],
});

app.notFound((c) => c.json({ detail: "Unknown route." }, 404));
