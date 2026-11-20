/* src/lib/server/plural/routes/admin.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, signedIn } from "../openapi";
import { MessageSchema } from "../schemas";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { broadcastFrontendUpdate } from "../ws";
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

// Member avatars uploaded from the admin page. Public, so Discord and browsers can load them
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
