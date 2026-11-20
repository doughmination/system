/* src/lib/server/plural/routes/members.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, jsonBody, signedIn } from "../openapi";
import {
  IdentifierParam,
  MemberCreateSchema,
  MemberSchema,
  MemberUpdateSchema,
  MessageSchema,
} from "../schemas";
import { createMember, deleteMember, findMember, getMembers, updateMember } from "../services/system";
import { getMemberTags, updateMemberTags, addMemberTag, removeMemberTag, enrichMembersWithTags } from "../services/tags";
import { enrichMembersWithStatus } from "../services/status";
import { getMemberPride, addMemberPride, removeMemberPride, enrichMembersWithPride } from "../services/pride";
import { requireAuth, requireOwner } from "../middleware/auth";
import { HttpError } from "../errors";
import { MAX_MEDIA_BYTES, mediaUrl } from "../services/importer";
import { rt } from "../runtime";
import type { JsonObject } from "../types";

export const membersRoutes = router();

type Member = z.infer<typeof MemberSchema>;

async function enrichFully(members: JsonObject[]): Promise<Member[]> {
  const withTags = await enrichMembersWithTags(members);
  const withStatus = await enrichMembersWithStatus(withTags);
  return (await enrichMembersWithPride(withStatus)) as Member[];
}

async function enrichOne(member: JsonObject): Promise<Member> {
  const [enriched] = await enrichFully([member]);
  return enriched as Member;
}

// ---- Members ----

membersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/members",
    tags: ["Members"],
    summary: "Every member, with tags, status and pride",
    responses: ok(z.array(MemberSchema)),
  }),
  async (c) => c.json(await enrichFully(await getMembers()), 200),
);

membersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/member/{member_identifier}",
    tags: ["Members"],
    summary: "One member by id or name",
    request: {
      params: IdentifierParam,
    },
    responses: ok(MemberSchema),
  }),
  async (c) => {
    const member = await findMember(c.req.valid("param").member_identifier);
    if (!member) throw new HttpError(404, "Member not found");
    return c.json(await enrichOne(member), 200);
  },
);

membersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/members",
    tags: ["Members"],
    summary: "Create a member (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: jsonBody(MemberCreateSchema),
    responses: ok(MemberSchema, "The new member"),
  }),
  async (c) => c.json(await enrichOne(await createMember(c.req.valid("json"))), 200),
);

membersRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/members/{member_identifier}",
    tags: ["Members"],
    summary: "Edit a member (owner). Send only the fields to change; null clears one",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam,
      ...jsonBody(MemberUpdateSchema),
    },
    responses: ok(MemberSchema, "The updated member"),
  }),
  async (c) => {
    const member = await updateMember(c.req.valid("param").member_identifier, c.req.valid("json"));
    return c.json(await enrichOne(member), 200);
  },
);

// No SVG: it would run scripts from this site's own origin
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

membersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/members/{member_identifier}/avatar",
    tags: ["Members"],
    summary: "Upload a member's avatar (owner). Replaces the old one, including the proxy avatar",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam,
    },
    responses: ok(MemberSchema, "The updated member"),
  }),
  async (c) => {
    const member = await findMember(c.req.valid("param").member_identifier);
    if (!member) throw new HttpError(404, "Member not found");

    const type = c.req.header("Content-Type") ?? "";
    if (!AVATAR_TYPES.includes(type)) throw new HttpError(415, "Use a PNG, JPEG, GIF or WebP image");

    const body = await c.req.arrayBuffer();
    if (body.byteLength === 0) throw new HttpError(400, "The image is empty");
    if (body.byteLength > MAX_MEDIA_BYTES) throw new HttpError(413, "The image is over 10 MB");

    // Same key the importer uses, so an upload overwrites the imported image
    const key = `member-${member.id}-avatar_url`;
    await rt().env.MEDIA.put(key, body, {
      httpMetadata: {
        contentType: type,
      },
    });

    // New query each time so Discord and browsers drop their cached copy
    const updated = await updateMember(member.id as string, {
      avatar_url: `${mediaUrl(key)}?v=${Date.now()}`,
      webhook_avatar_url: null,
    });
    return c.json(await enrichOne(updated), 200);
  },
);

membersRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/members/{member_identifier}",
    tags: ["Members"],
    summary: "Delete a member (owner). Their past switches are kept",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam,
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    if (!(await deleteMember(identifier))) throw new HttpError(404, "Member not found");
    return c.json({ status: "success", message: `Deleted ${identifier}` }, 200);
  },
);

// ---- Member tags ----

membersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/member-tags",
    tags: ["Tags"],
    summary: "Every member's tags (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    responses: ok(
      z.object({
        status: z.string(),
        member_tags: z.record(z.string(), z.array(z.string())),
      }),
    ),
  }),
  async (c) => c.json({ status: "success", member_tags: await getMemberTags() }, 200),
);

membersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/member-tags/{member_identifier}",
    tags: ["Tags"],
    summary: "Replace a member's tags (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam,
      ...jsonBody(z.array(z.string())),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    const tags = c.req.valid("json");
    await updateMemberTags(identifier, tags);
    return c.json({ status: "success", message: `Updated tags for ${identifier}`, tags }, 200);
  },
);

membersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/member-tags/{member_identifier}/add",
    tags: ["Tags"],
    summary: "Add one tag to a member (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam,
      ...jsonBody(z.object({ tag: z.string().min(1) })),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    const { tag } = c.req.valid("json");
    const added = await addMemberTag(identifier, tag);
    return added
      ? c.json({ status: "success", message: `Added tag '${tag}' to ${identifier}` }, 200)
      : c.json({ status: "info", message: `Tag '${tag}' already exists for ${identifier}` }, 200);
  },
);

membersRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/member-tags/{member_identifier}/{tag}",
    tags: ["Tags"],
    summary: "Remove one tag from a member (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam.extend({ tag: z.string() }),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const { member_identifier: identifier, tag } = c.req.valid("param");
    if (!(await removeMemberTag(identifier, tag))) {
      throw new HttpError(404, `Tag '${tag}' not found for ${identifier}`);
    }
    return c.json({ status: "success", message: `Removed tag '${tag}' from ${identifier}` }, 200);
  },
);

// ---- Member pride identities ----

membersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/member-pride",
    tags: ["Pride"],
    summary: "Every member's pride identities (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    responses: ok(
      z.object({
        status: z.string(),
        member_pride: z.record(z.string(), z.array(z.string())),
      }),
    ),
  }),
  async (c) => c.json({ status: "success", member_pride: await getMemberPride() }, 200),
);

membersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/member-pride/{member_identifier}/add",
    tags: ["Pride"],
    summary: "Add a pride identity to a member (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam,
      ...jsonBody(z.object({ identity: z.string().min(1) })),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const identifier = c.req.valid("param").member_identifier;
    const { identity } = c.req.valid("json");
    const added = await addMemberPride(identifier, identity);
    return added
      ? c.json({ status: "success", message: `Added pride '${identity}' to ${identifier}` }, 200)
      : c.json({ status: "info", message: `Pride '${identity}' already set for ${identifier}` }, 200);
  },
);

membersRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/member-pride/{member_identifier}/{identity}",
    tags: ["Pride"],
    summary: "Remove a pride identity from a member (owner)",
    security: signedIn,
    middleware: [requireAuth, requireOwner] as const,
    request: {
      params: IdentifierParam.extend({ identity: z.string() }),
    },
    responses: ok(MessageSchema),
  }),
  async (c) => {
    const { member_identifier: identifier, identity } = c.req.valid("param");
    if (!(await removeMemberPride(identifier, identity))) {
      throw new HttpError(404, `Pride '${identity}' not found for ${identifier}`);
    }
    return c.json({ status: "success", message: `Removed pride '${identity}' from ${identifier}` }, 200);
  },
);
