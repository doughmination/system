/* src/lib/server/plural/routes/system.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import { MentalStateWireSchema, MessageSchema, SystemSchema, SystemUpdateSchema } from "../schemas";
import { getSystem, updateSystem } from "../services/system";
import { getMentalState, saveMentalState } from "../services/mental_state";
import { requireAuth, requireAdmin, requireOwner } from "../middleware/auth";
import { broadcastMentalStateUpdate } from "../ws";
import { HttpError } from "../errors";

export const systemRoutes = router();

function mentalStateJson(state: Awaited<ReturnType<typeof getMentalState>>) {
  return {
    level: state.level,
    updated_at: state.updated_at.toISOString(),
    notes: state.notes ?? null,
  };
}

systemRoutes.openapi(
  createRoute({
    method: "get",
    path: "/system",
    tags: ["System"],
    summary: "The system, with its current mental state",
    responses: ok(SystemSchema),
  }),
  async (c) => {
    const system = await getSystem();
    return c.json({ ...system, mental_state: mentalStateJson(await getMentalState()) } as z.infer<typeof SystemSchema>, 200);
  },
);

systemRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/system",
    tags: ["System"],
    summary: "Edit the system (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: jsonBody(SystemUpdateSchema),
    responses: ok(SystemSchema),
  }),
  async (c) => {
    const system = await updateSystem(c.req.valid("json"));
    return c.json(system as z.infer<typeof SystemSchema>, 200);
  },
);

systemRoutes.openapi(
  createRoute({
    method: "get",
    path: "/mental-state",
    tags: ["System"],
    summary: "Current mental state",
    responses: ok(MentalStateWireSchema),
  }),
  async (c) => c.json(mentalStateJson(await getMentalState()), 200),
);

systemRoutes.openapi(
  createRoute({
    method: "post",
    path: "/mental-state",
    tags: ["System"],
    summary: "Set the mental state (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    request: jsonBody(
      z.object({
        level: z.string().min(1),
        notes: z.string().nullable().optional(),
      }),
    ),
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const body = c.req.valid("json");
    const state = {
      level: body.level,
      updated_at: new Date(),
      notes: body.notes ?? null,
    };
    if (!(await saveMentalState(state))) throw new HttpError(500, "Failed to save mental state");
    await broadcastMentalStateUpdate(mentalStateJson(state));
    return c.json({ success: true, message: "Mental state updated" }, 200);
  },
);
