/* src/lib/server/plural/services/tags.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { JsonObject } from "../types";
import { rt } from "../runtime";

type MemberTagsMap = Record<string, string[]>;

const KEY = "member_tags";
const DEFAULT_MEMBER_TAGS: MemberTagsMap = { C1: ["Host"] };

export async function getMemberTags(): Promise<MemberTagsMap> {
  const stored = await rt().store.get<MemberTagsMap | null>(KEY, null);
  if (!stored) {
    await saveMemberTags(DEFAULT_MEMBER_TAGS);
    return { ...DEFAULT_MEMBER_TAGS };
  }
  return stored;
}

export async function saveMemberTags(memberTags: MemberTagsMap): Promise<void> {
  await rt().store.put(KEY, memberTags);
}

export async function getMemberTagsById(memberId: string, memberName: string): Promise<string[]> {
  const memberTags = await getMemberTags();
  return memberTags[memberName] ?? memberTags[memberId] ?? [];
}

export async function updateMemberTags(memberIdentifier: string, tags: string[]): Promise<boolean> {
  const memberTags = await getMemberTags();
  memberTags[memberIdentifier] = tags;
  await saveMemberTags(memberTags);
  return true;
}

export async function addMemberTag(memberIdentifier: string, tag: string): Promise<boolean> {
  const memberTags = await getMemberTags();
  const list = (memberTags[memberIdentifier] ??= []);
  if (!list.includes(tag)) {
    list.push(tag);
    await saveMemberTags(memberTags);
    return true;
  }
  return false;
}

export async function removeMemberTag(memberIdentifier: string, tag: string): Promise<boolean> {
  const memberTags = await getMemberTags();
  const tags = memberTags[memberIdentifier];
  if (tags && tags.includes(tag)) {
    memberTags[memberIdentifier] = tags.filter((t) => t !== tag);
    await saveMemberTags(memberTags);
    return true;
  }
  return false;
}

export async function enrichMembersWithTags(members: JsonObject[]): Promise<JsonObject[]> {
  // One store read for the whole list, not one per member
  const memberTags = await getMemberTags();

  return members.map((member) => ({
    ...member,
    tags: memberTags[member.name ?? ""] ?? memberTags[member.id ?? ""] ?? [],
  }));
}
