/* src/lib/server/plural/routes/bot.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, botAuth, signedIn } from "../openapi";
import { FrontersSchema, MemberSchema, MessageSchema, SystemSchema } from "../schemas";
import { getSystem, getMembers } from "../services/system";
import { enrichMembersWithTags } from "../services/tags";
import { enrichMembersWithStatus } from "../services/status";
import { requireAuth, requireOwner, verifyBotAccess } from "../middleware/auth";
import { HttpError } from "../errors";
import { switchAndBroadcast } from "./fronting";
import { getFronters } from "../services/system";

export const botRoutes = router();

const TOKEN_MANAGED_MSG =
  "Bot token is set manually via the DOUGH_BOT_TOKEN secret; rotate it with `wrangler secret put DOUGH_BOT_TOKEN`.";

function wrapped<T extends z.ZodType>(schema: T) {
  return z.object({
    success: z.boolean(),
    data: schema,
  });
}

botRoutes.openapi(
  createRoute({
    method: "get",
    path: "/bot/health",
    tags: ["Bot"],
    summary: "Check the bot token works",
    security: botAuth,
    middleware: [verifyBotAccess] as const,
    responses: ok(MessageSchema),
  }),
  (c) => c.json({ status: "ok", message: "Bot API is operational", authenticated: true }, 200),
);

botRoutes.openapi(
  createRoute({
    method: "post",
    path: "/bot/token/regenerate",
    tags: ["Bot"],
    summary: "Retired. Always 410",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    responses: ok(MessageSchema),
  }),
  () => {
    throw new HttpError(410, TOKEN_MANAGED_MSG);
  },
);

botRoutes.openapi(
  createRoute({
    method: "post",
    path: "/bot/token/regenerate-self",
    tags: ["Bot"],
    summary: "Retired. Always 410",
    security: botAuth,
    middleware: [verifyBotAccess] as const,
    responses: ok(MessageSchema),
  }),
  () => {
    throw new HttpError(410, TOKEN_MANAGED_MSG);
  },
);

botRoutes.openapi(
  createRoute({
    method: "get",
    path: "/bot/system/info",
    tags: ["Bot"],
    summary: "The system",
    security: botAuth,
    middleware: [verifyBotAccess] as const,
    responses: ok(wrapped(SystemSchema)),
  }),
  async (c) => c.json({ success: true, data: (await getSystem()) as z.infer<typeof SystemSchema> }, 200),
);

botRoutes.openapi(
  createRoute({
    method: "get",
    path: "/bot/members",
    tags: ["Bot"],
    summary: "Every member, with tags and status",
    security: botAuth,
    middleware: [verifyBotAccess] as const,
    responses: ok(wrapped(z.array(MemberSchema))),
  }),
  async (c) => {
    const withTags = await enrichMembersWithTags(await getMembers());
    const members = (await enrichMembersWithStatus(withTags)) as z.infer<typeof MemberSchema>[];
    return c.json({ success: true, data: members }, 200);
  },
);

botRoutes.openapi(
  createRoute({
    method: "get",
    path: "/bot/fronters",
    tags: ["Bot"],
    summary: "Who is fronting now",
    security: botAuth,
    middleware: [verifyBotAccess] as const,
    responses: ok(wrapped(FrontersSchema)),
  }),
  async (c) => c.json({ success: true, data: (await getFronters()) as z.infer<typeof FrontersSchema> }, 200),
);

botRoutes.openapi(
  createRoute({
    method: "post",
    path: "/bot/switch",
    tags: ["Bot"],
    summary: "Set the front",
    security: botAuth,
    middleware: [verifyBotAccess] as const,
    request: jsonBody(z.object({ member_ids: z.array(z.string()) })),
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const memberIds = c.req.valid("json").member_ids;
    const fronters = await switchAndBroadcast(memberIds);
    return c.json(
      {
        status: "success",
        message: "Fronters updated successfully",
        fronters: fronters.members,
        count: memberIds.length,
      },
      200,
    );
  },
);
