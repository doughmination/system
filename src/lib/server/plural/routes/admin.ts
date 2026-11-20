/* src/lib/server/plural/routes/admin.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import { MessageSchema } from "../schemas";
import { requireAuth, requireAdmin, requireOwner } from "../middleware/auth";
import { broadcastFrontendUpdate } from "../ws";
import { importPluralKitExport } from "../services/importer";
import { rt } from "../runtime";

export const adminRoutes = router();

adminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/admin/refresh",
    tags: ["Admin"],
    summary: "Reload every open page (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    responses: ok(MessageSchema),
  }),
  async (c) => {
    await broadcastFrontendUpdate("force_refresh", { message: "Admin initiated refresh" });
    return c.json({ success: true, message: "Refresh broadcast sent" }, 200);
  },
);

adminRoutes.openapi(
  createRoute({
    method: "post",
    path: "/admin/import/pluralkit",
    tags: ["Admin"],
    summary: "Import a PluralKit export file (owner). Images are copied into this site's storage",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      query: z.object({
        replace: z
          .enum(["true", "false"])
          .default("false")
          .openapi({ description: "Overwrite an already-imported system, members and switch history" }),
        copy_media: z.enum(["true", "false"]).default("true"),
      }),
      ...jsonBody(z.looseObject({}).openapi({ description: "The JSON file from pk;export, unchanged" })),
    },
    responses: ok(
      z.object({
        system: z.string(),
        members: z.number(),
        switches: z.number(),
        media_copied: z.number(),
        media_failed: z.array(z.string()),
      }),
    ),
  }),
  async (c) => {
    const query = c.req.valid("query");
    const report = await importPluralKitExport(c.req.valid("json"), {
      replace: query.replace === "true",
      copyMedia: query.copy_media === "true",
    });
    await broadcastFrontendUpdate("members_update", {});
    return c.json(report, 200);
  },
);

// Images copied in by the importer. Public, like the PluralKit CDN was
adminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/media/{key}",
    tags: ["Media"],
    summary: "A stored avatar or banner",
    request: {
      params: z.object({
        key: z
          .string()
          .regex(/^[a-z0-9_-]+$/)
          .openapi({ example: "member-abcdef-avatar_url" }),
      }),
    },
    responses: {
      200: {
        description: "The image",
        content: {
          "image/*": {
            schema: z.string().openapi({ format: "binary" }),
          },
        },
      },
    },
  }),
  async (c) => {
    const { key } = c.req.valid("param");
    const object = await rt().env.MEDIA.get(key);
    if (!object) return c.json({ detail: "Not found" }, 404) as never;

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=86400");
    return new Response(object.body, { headers }) as never;
  },
);
