/* src/lib/server/plural/schemas.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { z } from "@hono/zod-openapi";

import { EmailSchema } from "./models";

// ---- Shared ----

export const ErrorSchema = z
  .object({
    detail: z.union([z.string(), z.array(z.unknown())]),
  })
  .openapi("Error");

export const MessageSchema = z
  .looseObject({
    status: z.string().optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
  })
  .openapi("Message");

export const IdentifierParam = z.object({
  member_identifier: z.string().openapi({
    param: {
      name: "member_identifier",
      in: "path",
    },
    description: "Member id, or member name (case-insensitive)",
    example: "abcdef",
  }),
});

const Hex = z
  .string()
  .regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-digit hex colour without '#'")
  .nullable();

const Url = z.url().max(2048).nullable();

// ---- Members ----

export const ProxyTagSchema = z
  .object({
    prefix: z.string().max(100).nullable(),
    suffix: z.string().max(100).nullable(),
  })
  .openapi("ProxyTag");

export const MemberStatusSchema = z
  .object({
    text: z.string(),
    emoji: z.string().nullable(),
    updated_at: z.string(),
  })
  .openapi("MemberStatus");

export const MemberSchema = z
  .looseObject({
    id: z.string().openapi({ example: "abcdef" }),
    uuid: z.string(),
    system: z.string(),
    name: z.string(),
    display_name: z.string().nullable(),
    color: z.string().nullable(),
    birthday: z.string().nullable().openapi({ description: "YYYY-MM-DD. Year 0004 means the year is hidden" }),
    pronouns: z.string().nullable(),
    avatar_url: z.string().nullable(),
    webhook_avatar_url: z.string().nullable(),
    banner: z.string().nullable(),
    description: z.string().nullable(),
    created: z.string(),
    proxy_tags: z.array(ProxyTagSchema),
    keep_proxy: z.boolean(),
    autoproxy_enabled: z.boolean().nullable(),
    message_count: z.number(),
    last_message_timestamp: z.string().nullable(),
    privacy: z.record(z.string(), z.unknown()),
    is_special: z.boolean().optional(),
    original_name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: MemberStatusSchema.nullable().optional(),
    pride: z.array(z.string()).optional(),
  })
  .openapi("Member");

const memberFields = {
  name: z.string().trim().min(1).max(100),
  display_name: z.string().max(100).nullable(),
  color: Hex,
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .nullable(),
  pronouns: z.string().max(100).nullable(),
  avatar_url: Url,
  webhook_avatar_url: Url,
  banner: Url,
  description: z.string().max(1000).nullable(),
  proxy_tags: z.array(ProxyTagSchema).max(100),
  keep_proxy: z.boolean(),
  autoproxy_enabled: z.boolean().nullable(),
  privacy: z.record(z.string(), z.enum(["public", "private"])),
};

export const MemberCreateSchema = z
  .object(memberFields)
  .partial()
  .required({ name: true })
  .openapi("MemberCreate");

export const MemberUpdateSchema = z.object(memberFields).partial().openapi("MemberUpdate");

// ---- System ----

export const MentalStateWireSchema = z
  .object({
    level: z.string(),
    updated_at: z.string(),
    notes: z.string().nullable().optional(),
  })
  .openapi("MentalState");

export const SystemSchema = z
  .looseObject({
    id: z.string(),
    uuid: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    tag: z.string().nullable(),
    pronouns: z.string().nullable(),
    avatar_url: z.string().nullable(),
    banner: z.string().nullable(),
    color: z.string().nullable(),
    timezone: z.string().nullable(),
    created: z.string(),
    privacy: z.record(z.string(), z.unknown()),
    mental_state: MentalStateWireSchema.optional(),
  })
  .openapi("System");

export const SystemUpdateSchema = z
  .object({
    name: z.string().max(100).nullable(),
    description: z.string().max(1000).nullable(),
    tag: z.string().max(79).nullable(),
    pronouns: z.string().max(100).nullable(),
    avatar_url: Url,
    banner: Url,
    color: Hex,
    timezone: z.string().max(64).nullable(),
    privacy: z.record(z.string(), z.enum(["public", "private"])),
  })
  .partial()
  .openapi("SystemUpdate");

// ---- Switches ----

export const SwitchSchema = z
  .object({
    id: z.string(),
    timestamp: z.string(),
    members: z.array(z.string()),
  })
  .openapi("Switch");

export const FrontersSchema = z
  .object({
    id: z.string().nullable(),
    timestamp: z.string().nullable(),
    members: z.array(MemberSchema),
  })
  .openapi("Fronters");

// ---- Relationships ----

export const RelationshipSchema = z
  .object({
    id: z.string(),
    members: z.tuple([z.string(), z.string()]),
    type: z.string(),
    since: z.string().nullable(),
  })
  .openapi("Relationship");

// ---- Users ----

export const UserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    display_name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    is_admin: z.boolean(),
    is_owner: z.boolean(),
    is_pet: z.boolean(),
    avatar_url: z.string().nullable().optional(),
  })
  .openapi("User");

export const UserCreateBody = z
  .object({
    username: z.string().min(1),
    pocket_id: z.string().nullable().optional(),
    email: EmailSchema.nullable().optional(),
    display_name: z.string().nullable().optional(),
    is_admin: z.boolean().default(false),
    is_pet: z.boolean().default(false),
  })
  .openapi("UserCreate");

export const UserUpdateBody = z
  .object({
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    email: EmailSchema.nullable().optional(),
    is_admin: z.boolean().nullable().optional(),
    is_pet: z.boolean().nullable().optional(),
  })
  .openapi("UserUpdate");

// ---- Metrics ----

export const FrontingTimeSchema = z
  .looseObject({
    total_time: z.number(),
    members: z.record(z.string(), z.unknown()),
    timeframes: z.record(z.string(), z.record(z.string(), z.number())),
  })
  .openapi("FrontingTimeMetrics");

export const SwitchFrequencySchema = z
  .object({
    total_switches: z.number(),
    avg_switches_per_day: z.number(),
    timeframes: z.record(z.string(), z.number()),
  })
  .openapi("SwitchFrequencyMetrics");
