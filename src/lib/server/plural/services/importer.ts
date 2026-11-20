/* src/lib/server/plural/services/importer.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { rt } from "../runtime";
import { HttpError } from "../errors";
import { frontendUrl } from "../config";
import type { JsonObject } from "../types";

const MEDIA_FIELDS = ["avatar_url", "webhook_avatar_url", "banner"] as const;
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

// D1 caps how much one batch may carry, so big switch histories go in slices
const BATCH_SIZE = 200;

export interface ImportReport {
  system: string;
  members: number;
  switches: number;
  media_copied: number;
  media_failed: string[];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

export function mediaUrl(key: string): string {
  return `${frontendUrl()}/api/plural/media/${key}`;
}

// Copy one image into R2. Returns the new URL, or null when the source is gone or not an image
async function copyMedia(source: string, key: string): Promise<string | null> {
  if (source.startsWith(mediaUrl(""))) return source;

  try {
    const response = await fetch(source);
    const type = response.headers.get("Content-Type") ?? "";
    if (!response.ok || !type.startsWith("image/")) return null;

    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_MEDIA_BYTES) return null;

    await rt().env.MEDIA.put(key, body, { httpMetadata: { contentType: type } });
    return mediaUrl(key);
  } catch {
    return null;
  }
}

async function copyAllMedia(owner: JsonObject, prefix: string, report: ImportReport): Promise<void> {
  for (const field of MEDIA_FIELDS) {
    const source = text(owner[field]);
    if (!source) continue;

    const copied = await copyMedia(source, `${prefix}-${field}`);
    if (copied) {
      owner[field] = copied;
      report.media_copied += 1;
    } else {
      // Keep the old URL so nothing disappears; it can be re-uploaded by hand
      report.media_failed.push(`${prefix}.${field}`);
    }
  }
}

async function runBatches(statements: D1PreparedStatement[]): Promise<void> {
  for (let start = 0; start < statements.length; start += BATCH_SIZE) {
    await rt().db.batch(statements.slice(start, start + BATCH_SIZE));
  }
}

// A PluralKit export file (pk;export). `replace` must be set to overwrite an existing system
export async function importPluralKitExport(
  data: JsonObject,
  options: { replace: boolean; copyMedia: boolean },
): Promise<ImportReport> {
  const systemHid = text(data.id);
  if (!systemHid || !Array.isArray(data.members) || !Array.isArray(data.switches)) {
    throw new HttpError(422, "That doesn't look like a PluralKit export (needs id, members and switches)");
  }

  const existing = await rt().db.prepare("SELECT id FROM systems LIMIT 1").first<{ id: string }>();
  if (existing && !options.replace) {
    throw new HttpError(409, "A system is already imported. Send replace=true to overwrite it.");
  }

  const report: ImportReport = {
    system: systemHid,
    members: 0,
    switches: 0,
    media_copied: 0,
    media_failed: [],
  };

  const members = data.members as JsonObject[];
  if (options.copyMedia) {
    await copyAllMedia(data, "system", report);
    for (const member of members) await copyAllMedia(member, `member-${member.id}`, report);
  }

  const db = rt().db;
  const statements: D1PreparedStatement[] = [
    db.prepare("DELETE FROM switches"),
    db.prepare("DELETE FROM members"),
    db.prepare("DELETE FROM systems"),
    db
      .prepare(
        `INSERT INTO systems (id, uuid, name, description, tag, pronouns, avatar_url, banner, color, timezone, created, privacy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        systemHid,
        text(data.uuid) ?? crypto.randomUUID(),
        text(data.name),
        text(data.description),
        text(data.tag),
        text(data.pronouns),
        text(data.avatar_url),
        text(data.banner),
        text(data.color),
        text(data.config?.timezone) ?? text(data.timezone),
        text(data.created) ?? new Date().toISOString(),
        JSON.stringify(data.privacy ?? {}),
      ),
  ];

  for (const member of members) {
    const id = text(member.id);
    const name = text(member.name);
    if (!id || !name) continue;

    statements.push(
      db
        .prepare(
          `INSERT INTO members (id, uuid, system_id, name, display_name, color, birthday, pronouns, avatar_url,
             webhook_avatar_url, banner, description, created, proxy_tags, keep_proxy, autoproxy_enabled,
             message_count, last_message_timestamp, privacy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          text(member.uuid) ?? crypto.randomUUID(),
          systemHid,
          name,
          text(member.display_name),
          text(member.color),
          text(member.birthday),
          text(member.pronouns),
          text(member.avatar_url),
          text(member.webhook_avatar_url),
          text(member.banner),
          text(member.description),
          text(member.created) ?? new Date().toISOString(),
          JSON.stringify(Array.isArray(member.proxy_tags) ? member.proxy_tags : []),
          member.keep_proxy ? 1 : 0,
          member.autoproxy_enabled == null ? null : member.autoproxy_enabled ? 1 : 0,
          Number(member.message_count) || 0,
          text(member.last_message_timestamp),
          JSON.stringify(member.privacy ?? {}),
        ),
    );
    report.members += 1;
  }

  for (const entry of data.switches as JsonObject[]) {
    const timestamp = text(entry.timestamp);
    if (!timestamp || !Array.isArray(entry.members)) continue;

    statements.push(
      db
        .prepare("INSERT INTO switches (id, system_id, timestamp, members) VALUES (?, ?, ?, ?)")
        .bind(text(entry.id) ?? crypto.randomUUID(), systemHid, timestamp, JSON.stringify(entry.members.map(String))),
    );
    report.switches += 1;
  }

  // shortcut: batches commit one slice at a time, so a failure part-way leaves a partial import. Re-run with replace=true
  await runBatches(statements);
  return report;
}
