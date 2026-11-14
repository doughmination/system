/* src/lib/server/plural/routes/relationships.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import { MessageSchema, RelationshipSchema } from "../schemas";
import { getRelationships, addRelationship, removeRelationship } from "../services/relationships";
import { requireAuth, requireOwner } from "../middleware/auth";
import { HttpError } from "../errors";

export const relationshipsRoutes = router();

relationshipsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/relationships",
    tags: ["Relationships"],
    summary: "The whole relationship map",
    responses: ok(
      z.object({
        status: z.string(),
        relationships: z.array(RelationshipSchema),
      }),
    ),
  }),
  async (c) => c.json({ status: "success", relationships: await getRelationships() }, 200),
);

relationshipsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/relationships",
    tags: ["Relationships"],
    summary: "Link two members (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: jsonBody(
      z.object({
        memberA: z.string().min(1),
        memberB: z.string().min(1),
        type: z.string().min(1).optional().openapi({ description: "Defaults to 'partner'. 'crush' is one-way, A to B" }),
        since: z.string().nullable().optional(),
      }),
    ),
    responses: ok(
      z.object({
        status: z.string(),
        relationship: RelationshipSchema,
      }),
    ),
  }),
  async (c) => {
    const body = c.req.valid("json");
    if (body.memberA === body.memberB) {
      throw new HttpError(422, "A member cannot be in a relationship with themselves");
    }
    try {
      return c.json({ status: "success", relationship: await addRelationship(body) }, 200);
    } catch (err) {
      throw new HttpError(400, err instanceof Error ? err.message : String(err));
    }
  },
);

relationshipsRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/relationships/{id}",
    tags: ["Relationships"],
    summary: "Remove a link (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    if (!(await removeRelationship(id))) throw new HttpError(404, `Relationship '${id}' not found`);
    return c.json({ status: "success", message: `Removed relationship ${id}` }, 200);
  },
);
