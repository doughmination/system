/* src/routes/[member_id]/+page.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { error } from "@sveltejs/kit";
import type { PluralMember } from "doughmination-api/server";
import type { PageLoad } from "./$types";
import { publicClient } from "#lib/api.ts";

// Server-rendered so Discord embeds and live data stay current with no rebuild
export const load: PageLoad = async ({ fetch, params, depends }) => {
  depends("api:public");
  const api = publicClient(fetch);
  const id = params.member_id;

  const [member, status, members, relationships] = await Promise.all([
    api.getMember(id).catch(() => null),
    api.getMemberStatus(id).catch(() => null),
    api.getMembers().catch(() => [] as PluralMember[]),
    api.getRelationships().catch(() => null),
  ]);

  if (!member) {
    error(404, {
      title: "Member not found",
      message: "This member could not be found in the Doughmination System.",
    });
  }

  const isThis = (identifier: string) => identifier === member.id || identifier === member.name;
  // Crushes aren't partners, so they get their own section. They only go one
  // way: the first member has a crush on the second, so they only show there
  const partnerIds: string[] = [];
  const crushIds: string[] = [];
  const crushedByIds: string[] = [];
  for (const edge of relationships?.relationships ?? []) {
    if (edge.type === "crush") {
      if (isThis(edge.members[0])) crushIds.push(edge.members[1]);
      else if (isThis(edge.members[1])) crushedByIds.push(edge.members[0]);
    } else if (isThis(edge.members[0])) partnerIds.push(edge.members[1]);
    else if (isThis(edge.members[1])) partnerIds.push(edge.members[0]);
  }
  const toMembers = (ids: string[]) =>
    ids
      .map((identifier) => members.find((m) => m.id === identifier || m.name === identifier))
      .filter((m): m is PluralMember => Boolean(m));

  return {
    id,
    member: {
      ...member,
      status: status?.status ?? member.status ?? null,
    },
    partners: toMembers(partnerIds),
    // A crush that goes both ways is mutual
    crushes: toMembers(crushIds).map((crush) => ({
      ...crush,
      mutual: toMembers(crushedByIds).some((m) => m.id === crush.id),
    })),
  };
};
