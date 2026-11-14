/* src/lib/server/plural/routes/member_status.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import { IdentifierParam, MemberStatusSchema } from "../schemas";
import { getMemberStatus, setMemberStatus, clearMemberStatus } from "../services/status";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const memberStatusRoutes = router();

const StatusResponse = z.object({
  success: z.boolean(),
  member_identifier: z.string().optional(),
  message: z.string().optional(),
  status: MemberStatusSchema.nullable().optional(),
});

memberStatusRoutes.openapi(
  createRoute({
    method: "get",
    path: "/members/{member_identifier}/status",
    tags: ["Status"],
    summary: "A member's status note",
    request: {
      params: IdentifierParam,
    },
    responses: ok(StatusResponse),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    return c.json({ success: true, member_identifier: identifier, status: await getMemberStatus(identifier) }, 200);
  },
);

memberStatusRoutes.openapi(
  createRoute({
    method: "post",
    path: "/members/{member_identifier}/status",
    tags: ["Status"],
    summary: "Set a member's status note (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    request: {
      params: IdentifierParam,
      ...jsonBody(
        z.object({
          text: z.string().min(1, "Status text is required").max(100, "Status text must be 100 characters or less"),
          emoji: z.string().nullable().optional(),
        }),
      ),
    },
    responses: ok(StatusResponse),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    const { text, emoji } = c.req.valid("json");
    const status = await setMemberStatus(identifier, text, emoji ?? null);
    return c.json({ success: true, message: `Status updated for ${identifier}`, status }, 200);
  },
);

memberStatusRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/members/{member_identifier}/status",
    tags: ["Status"],
    summary: "Clear a member's status note (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    request: {
      params: IdentifierParam,
    },
    responses: ok(StatusResponse),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    return (await clearMemberStatus(identifier))
      ? c.json({ success: true, message: `Status cleared for ${identifier}` }, 200)
      : c.json({ success: false, message: `No status found for ${identifier}` }, 200);
  },
);
