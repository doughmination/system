/* src/lib/server/plural/services/system.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { rt } from "../runtime";
import { HttpError } from "../errors";
import type { JsonObject } from "../types";

// Shown instead of the stored name for a few placeholder members
const SPECIAL_DISPLAY_NAMES: Record<string, string> = {
  answer: "Answer Machine",
  system: "Unsure",
  sleeping: "I am sleeping",
};

// Columns a caller may write, and how each is stored
const MEMBER_TEXT_FIELDS = [
  "name",
  "display_name",
  "color",
  "birthday",
  "pronouns",
  "avatar_url",
  "webhook_avatar_url",
  "banner",
  "description",
] as const;

const SYSTEM_TEXT_FIELDS = [
  "name",
  "description",
  "tag",
  "pronouns",
  "avatar_url",
  "banner",
  "color",
  "timezone",
] as const;

type Row = Record<string, unknown>;

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function systemFromRow(row: Row): JsonObject {
  return {
    ...row,
    privacy: parseJson(row.privacy, {}),
  };
}

function memberFromRow(row: Row): JsonObject {
  const member: JsonObject = {
    ...row,
    system: row.system_id,
    proxy_tags: parseJson(row.proxy_tags, []),
    keep_proxy: row.keep_proxy === 1,
    autoproxy_enabled: row.autoproxy_enabled === null ? null : row.autoproxy_enabled === 1,
    privacy: parseJson(row.privacy, {}),
  };
  delete member.system_id;

  const name = String(member.name);
  if (name in SPECIAL_DISPLAY_NAMES) {
    member.display_name = SPECIAL_DISPLAY_NAMES[name];
    member.is_special = true;
    member.original_name = name;
  }
  return member;
}

// A 6-letter id in PluralKit's style, so imported and new ids look alike
function newShortId(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => letters[byte % letters.length]).join("");
}

// ---- System ----

async function systemRow(): Promise<Row> {
  const row = await rt().db.prepare("SELECT * FROM systems LIMIT 1").first<Row>();
  if (!row) throw new HttpError(404, "No system yet. Import one first.");
  return row;
}

export async function systemId(): Promise<string> {
  return String((await systemRow()).id);
}

export async function getSystem(): Promise<JsonObject> {
  return systemFromRow(await systemRow());
}

export async function updateSystem(patch: JsonObject): Promise<JsonObject> {
  const row = await systemRow();
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const field of SYSTEM_TEXT_FIELDS) {
    if (field in patch) {
      sets.push(`${field} = ?`);
      values.push(patch[field] ?? null);
    }
  }
  if ("privacy" in patch) {
    sets.push("privacy = ?");
    values.push(JSON.stringify(patch.privacy ?? {}));
  }

  if (sets.length > 0) {
    await rt()
      .db.prepare(`UPDATE systems SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...values, row.id)
      .run();
  }
  return getSystem();
}

// ---- Members ----

export async function getMembers(): Promise<JsonObject[]> {
  const { results } = await rt().db.prepare("SELECT * FROM members ORDER BY name COLLATE NOCASE").all<Row>();
  return results.map(memberFromRow);
}

// By id, or by name (case-insensitive), as the old routes accepted
export async function findMember(identifier: string): Promise<JsonObject | null> {
  const row = await rt()
    .db.prepare("SELECT * FROM members WHERE id = ? OR lower(name) = lower(?) LIMIT 1")
    .bind(identifier, identifier)
    .first<Row>();
  return row ? memberFromRow(row) : null;
}

function memberColumns(input: JsonObject): { names: string[]; values: unknown[] } {
  const names: string[] = [];
  const values: unknown[] = [];

  for (const field of MEMBER_TEXT_FIELDS) {
    if (field in input) {
      names.push(field);
      values.push(input[field] ?? null);
    }
  }
  if ("proxy_tags" in input) {
    names.push("proxy_tags");
    values.push(JSON.stringify(input.proxy_tags ?? []));
  }
  if ("keep_proxy" in input) {
    names.push("keep_proxy");
    values.push(input.keep_proxy ? 1 : 0);
  }
  if ("autoproxy_enabled" in input) {
    names.push("autoproxy_enabled");
    values.push(input.autoproxy_enabled == null ? null : input.autoproxy_enabled ? 1 : 0);
  }
  if ("privacy" in input) {
    names.push("privacy");
    values.push(JSON.stringify(input.privacy ?? {}));
  }
  return { names, values };
}

async function assertNameFree(name: string, exceptId?: string): Promise<void> {
  const clash = await findMember(name);
  if (clash && clash.id !== exceptId && String(clash.original_name ?? clash.name).toLowerCase() === name.toLowerCase()) {
    throw new HttpError(409, `A member named '${name}' already exists`);
  }
}

export async function createMember(input: JsonObject): Promise<JsonObject> {
  const system = await systemId();
  await assertNameFree(String(input.name));

  let id = newShortId();
  while (await findMember(id)) id = newShortId();

  const { names, values } = memberColumns(input);
  const columns = ["id", "uuid", "system_id", "created", ...names];
  const placeholders = columns.map(() => "?").join(", ");

  await rt()
    .db.prepare(`INSERT INTO members (${columns.join(", ")}) VALUES (${placeholders})`)
    .bind(id, crypto.randomUUID(), system, new Date().toISOString(), ...values)
    .run();

  return (await findMember(id)) as JsonObject;
}

export async function updateMember(identifier: string, patch: JsonObject): Promise<JsonObject> {
  const member = await findMember(identifier);
  if (!member) throw new HttpError(404, "Member not found");
  if (typeof patch.name === "string") await assertNameFree(patch.name, member.id);

  const { names, values } = memberColumns(patch);
  if (names.length > 0) {
    const sets = names.map((name) => `${name} = ?`).join(", ");
    await rt()
      .db.prepare(`UPDATE members SET ${sets} WHERE id = ?`)
      .bind(...values, member.id)
      .run();
  }
  return (await findMember(member.id)) as JsonObject;
}

// Past switches keep the id, so fronting history still adds up
export async function deleteMember(identifier: string): Promise<boolean> {
  const member = await findMember(identifier);
  if (!member) return false;
  await rt().db.prepare("DELETE FROM members WHERE id = ?").bind(member.id).run();
  return true;
}

// ---- Switches and fronters ----

function switchFromRow(row: Row): JsonObject {
  return {
    id: row.id,
    timestamp: row.timestamp,
    members: parseJson<string[]>(row.members, []),
  };
}

// Newest first, as PluralKit returned them
export async function getSwitches(limit = 1000, before?: string): Promise<JsonObject[]> {
  const statement = before
    ? rt().db.prepare("SELECT * FROM switches WHERE timestamp < ? ORDER BY timestamp DESC LIMIT ?").bind(before, limit)
    : rt().db.prepare("SELECT * FROM switches ORDER BY timestamp DESC LIMIT ?").bind(limit);
  const { results } = await statement.all<Row>();
  return results.map(switchFromRow);
}

export async function getFronters(): Promise<JsonObject> {
  const [latest] = await getSwitches(1);
  if (!latest) return { id: null, timestamp: null, members: [] };

  const members = await getMembers();
  const byId = new Map(members.map((member) => [member.id, member]));
  return {
    ...latest,
    members: (latest.members as string[])
      .map((id) => byId.get(id))
      .filter((member): member is JsonObject => Boolean(member)),
  };
}

export async function setFront(memberIds: string[]): Promise<JsonObject> {
  const unique = [...new Set(memberIds.map(String))];
  if (unique.length !== memberIds.length) throw new HttpError(400, "Duplicate member IDs in switch");

  const known = new Set((await getMembers()).map((member) => member.id));
  const unknown = unique.filter((id) => !known.has(id));
  if (unknown.length > 0) throw new HttpError(400, `Invalid member IDs: ${unknown.join(", ")}`);

  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    members: unique,
  };
  await rt()
    .db.prepare("INSERT INTO switches (id, system_id, timestamp, members) VALUES (?, ?, ?, ?)")
    .bind(entry.id, await systemId(), entry.timestamp, JSON.stringify(entry.members))
    .run();
  return entry;
}

export async function deleteSwitch(id: string): Promise<boolean> {
  const result = await rt().db.prepare("DELETE FROM switches WHERE id = ?").bind(id).run();
  return result.meta.changes === 1;
}
