/* src/lib/server/plural/services/localise.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { rt } from "../runtime";
import type { JsonObject } from "../types";
import { MAX_MEDIA_BYTES, mediaUrl } from "./media";
import { getMembers, getSystem, updateMember, updateSystem } from "./system";

// No SVG: it would run scripts from this site's own origin
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export interface LocaliseReport {
  copied: string[];
  removed: string[];
  kept: string[];
}

type Outcome = { kind: "copied"; url: string } | { kind: "removed" } | { kind: "kept"; reason: string };

function external(url: unknown): url is string {
  return typeof url === "string" && url !== "" && !url.startsWith(mediaUrl(""));
}

// Only 404 and 410 mean gone; anything else (403, 5xx, network) keeps the old link
async function copyInto(source: string, key: string): Promise<Outcome> {
  let response: Response;
  try {
    response = await fetch(source);
  } catch (error) {
    return {
      kind: "kept",
      reason: error instanceof Error ? error.message : "network error",
    };
  }

  if (response.status === 404 || response.status === 410) return { kind: "removed" };
  if (!response.ok) return { kind: "kept", reason: `HTTP ${response.status}` };

  const type = (response.headers.get("Content-Type") ?? "").split(";")[0]?.trim() ?? "";
  if (!IMAGE_TYPES.includes(type)) return { kind: "kept", reason: `not a PNG, JPEG, GIF or WebP (${type || "no type"})` };

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_MEDIA_BYTES) return { kind: "kept", reason: "over 10 MB" };

  await rt().env.MEDIA.put(key, body, {
    httpMetadata: {
      contentType: type,
    },
  });
  return {
    kind: "copied",
    url: `${mediaUrl(key)}?v=${Date.now()}`,
  };
}

// Applies one outcome to the patch and the report. Returns the new value for the field
function record(outcome: Outcome, label: string, report: LocaliseReport): string | null | undefined {
  if (outcome.kind === "copied") {
    report.copied.push(label);
    return outcome.url;
  }
  if (outcome.kind === "removed") {
    report.removed.push(label);
    return null;
  }
  report.kept.push(`${label}: ${outcome.reason}`);
  return undefined;
}

async function localiseMember(member: JsonObject, report: LocaliseReport): Promise<void> {
  const id = String(member.id);
  const name = String(member.name ?? id);
  const patch: JsonObject = {};

  // The avatar is the one image now; an old separate proxy avatar fills in when there's no avatar
  const avatarSource = external(member.avatar_url)
    ? member.avatar_url
    : member.avatar_url
      ? null
      : external(member.webhook_avatar_url)
        ? member.webhook_avatar_url
        : null;

  if (avatarSource) {
    const value = record(await copyInto(avatarSource, `member-${id}-avatar_url`), `${name} avatar`, report);
    if (value !== undefined) {
      patch.avatar_url = value;
      patch.webhook_avatar_url = null;
    }
  } else if (external(member.webhook_avatar_url)) {
    // The avatar is already local, so the proxy uses it too
    patch.webhook_avatar_url = null;
    report.removed.push(`${name} separate proxy avatar (now uses the avatar)`);
  }

  if (external(member.banner)) {
    const value = record(await copyInto(member.banner, `member-${id}-banner`), `${name} banner`, report);
    if (value !== undefined) patch.banner = value;
  }

  if (Object.keys(patch).length > 0) await updateMember(id, patch);
}

async function localiseSystem(report: LocaliseReport): Promise<void> {
  const system = await getSystem();
  const patch: JsonObject = {};

  for (const field of ["avatar_url", "banner"] as const) {
    const source = system[field];
    if (!external(source)) continue;

    const value = record(await copyInto(source, `system-${field}`), `system ${field}`, report);
    if (value !== undefined) patch[field] = value;
  }

  if (Object.keys(patch).length > 0) await updateSystem(patch);
}

// One-off: moves every member and system image onto this site's R2
export async function localiseMedia(): Promise<LocaliseReport> {
  const report: LocaliseReport = {
    copied: [],
    removed: [],
    kept: [],
  };

  for (const member of await getMembers()) await localiseMember(member, report);
  await localiseSystem(report);

  return report;
}
