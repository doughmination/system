/* src/lib/server/plural/routes/fronting.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import { FrontersSchema, MessageSchema, SwitchSchema } from "../schemas";
import { deleteSwitch, getFronters, getMembers, getSwitches, setFront } from "../services/system";
import { enrichMembersWithTags } from "../services/tags";
import { enrichMembersWithStatus } from "../services/status";
import { requireAuth, requireAuthOrBot, requireAdmin } from "../middleware/auth";
import { broadcastFrontingUpdate } from "../ws";
import { HttpError } from "../errors";
import type { JsonObject } from "../types";

export const frontingRoutes = router();

type Fronters = z.infer<typeof FrontersSchema>;

async function enrichedFronters(): Promise<Fronters> {
  const fronters = await getFronters();
  const withTags = await enrichMembersWithTags(fronters.members as JsonObject[]);
  return { ...fronters, members: await enrichMembersWithStatus(withTags) } as Fronters;
}

// Switch, then tell every connected page
export async function switchAndBroadcast(memberIds: string[]): Promise<Fronters> {
  await setFront(memberIds);
  const fronters = await enrichedFronters();
  await broadcastFrontingUpdate(fronters);
  return fronters;
}

frontingRoutes.openapi(
  createRoute({
    method: "get",
    path: "/fronters",
    tags: ["Fronting"],
    summary: "Who is fronting now",
    responses: ok(FrontersSchema),
  }),
  async (c) => c.json(await enrichedFronters(), 200),
);

frontingRoutes.openapi(
  createRoute({
    method: "get",
    path: "/switches",
    tags: ["Fronting"],
    summary: "Switch history, newest first",
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(1000).default(100),
        before: z.string().optional().openapi({ description: "Only switches before this ISO timestamp, for paging" }),
      }),
    },
    responses: ok(z.array(SwitchSchema)),
  }),
  async (c) => {
    const { limit, before } = c.req.valid("query");
    return c.json((await getSwitches(limit, before)) as z.infer<typeof SwitchSchema>[], 200);
  },
);

frontingRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/switches/{id}",
    tags: ["Fronting"],
    summary: "Delete a mistaken switch (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    if (!(await deleteSwitch(id))) throw new HttpError(404, "Switch not found");
    await broadcastFrontingUpdate(await enrichedFronters());
    return c.json({ status: "success", message: "Switch deleted" }, 200);
  },
);

frontingRoutes.openapi(
  createRoute({
    method: "post",
    path: "/switch",
    tags: ["Fronting"],
    summary: "Set the front. An empty list means switch-out. proxyBot's token works here too",
    security: signedIn,
    middleware: [requireAuthOrBot] as const,
    request: jsonBody(z.object({ members: z.array(z.string()).default([]) })),
    responses: ok(MessageSchema),
  }),
  async (c) => {
    await switchAndBroadcast(c.req.valid("json").members);
    return c.json({ status: "success", message: "Front updated successfully" }, 200);
  },
);

frontingRoutes.openapi(
  createRoute({
    method: "post",
    path: "/switch_front",
    tags: ["Fronting"],
    summary: "Switch to a single member",
    security: signedIn,
    middleware: [requireAuth] as const,
    request: jsonBody(z.object({ member_id: z.string().min(1, "member_id is required") })),
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const fronters = await switchAndBroadcast([c.req.valid("json").member_id]);
    return c.json({ success: true, message: "Front updated", data: fronters }, 200);
  },
);

frontingRoutes.openapi(
  createRoute({
    method: "post",
    path: "/multi_switch",
    tags: ["Fronting"],
    summary: "Switch to several members, echoing their names back",
    security: signedIn,
    middleware: [requireAuth] as const,
    request: jsonBody(z.object({ member_ids: z.array(z.string()).default([]) })),
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const memberIds = c.req.valid("json").member_ids;
    await switchAndBroadcast(memberIds);

    const byId = new Map((await getMembers()).map((member) => [member.id, member]));
    const fronters = memberIds
      .map((id) => byId.get(id))
      .filter((member): member is JsonObject => Boolean(member))
      .map((member) => ({
        id: member.id,
        name: member.name,
        display_name: member.display_name ?? member.name,
      }));

    return c.json(
      {
        status: "success",
        message: "Fronters updated successfully",
        fronters,
        count: fronters.length,
      },
      200,
    );
  },
);
