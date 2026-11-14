/* src/lib/server/plural/routes/users.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import { MessageSchema, UserCreateBody, UserSchema, UserUpdateBody } from "../schemas";
import { toUserResponse } from "../models";
import type { User } from "../models";
import { getUsers, createUser, updateUser, deleteUser } from "../services/users";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { HttpError } from "../errors";

export const usersRoutes = router();

const UserIdParam = z.object({ user_id: z.string() });

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

usersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/users",
    tags: ["Users"],
    summary: "Every site account (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    responses: ok(z.array(UserSchema)),
  }),
  async (c) => c.json((await getUsers()).map(toUserResponse), 200),
);

usersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/users",
    tags: ["Users"],
    summary: "Pre-provision an account (admin). It links on the person's first SSO sign-in",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    request: jsonBody(UserCreateBody),
    responses: ok(UserSchema),
  }),
  async (c) => {
    try {
      return c.json(toUserResponse(await createUser(c.req.valid("json"), c.get("user") ?? null)), 200);
    } catch (err) {
      throw new HttpError(400, errorMessage(err));
    }
  },
);

usersRoutes.openapi(
  createRoute({
    method: "put",
    path: "/users/{user_id}",
    tags: ["Users"],
    summary: "Edit an account. Your own, or anyone's as an admin",
    security: signedIn,
    middleware: [requireAuth] as const,
    request: {
      params: UserIdParam,
      ...jsonBody(UserUpdateBody),
    },
    responses: ok(UserSchema),
  }),
  async (c) => {
    const { user_id: userId } = c.req.valid("param");
    const currentUser = c.get("user") as User;
    if (!currentUser.is_admin && currentUser.id !== userId) {
      throw new HttpError(403, "Not authorized to update this user");
    }

    let updated: User | null;
    try {
      updated = await updateUser(userId, c.req.valid("json"), currentUser);
    } catch (err) {
      throw new HttpError(400, errorMessage(err));
    }
    if (!updated) throw new HttpError(404, "User not found");
    return c.json(toUserResponse(updated), 200);
  },
);

usersRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/users/{user_id}",
    tags: ["Users"],
    summary: "Delete an account (admin)",
    security: signedIn,
    middleware: [requireAuth, requireAdmin] as const,
    request: {
      params: UserIdParam,
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const { user_id: userId } = c.req.valid("param");
    const currentUser = c.get("user") as User;
    if (userId === currentUser.id) throw new HttpError(400, "Cannot delete your own account");

    let deleted: boolean;
    try {
      deleted = await deleteUser(userId, currentUser);
    } catch (err) {
      throw new HttpError(403, errorMessage(err));
    }
    if (!deleted) throw new HttpError(404, "User not found");
    return c.json({ message: "User deleted successfully" }, 200);
  },
);
