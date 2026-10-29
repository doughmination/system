/* src/lib/index.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { PluralMember } from "doughmination-api/server";

export const siteName = "Doughmination System";

export const siteUrl = "https://doughmination.co.uk";

export const fallbackAvatar = "https://raw.doughmination.gay/favicons/favicon.png";

export const mainSite = "https://doughmination.gay";

export function memberName(member: Pick<PluralMember, "display_name" | "name" | "id">): string {
  return member.display_name || member.name || member.id;
}

/** A–Z by the name people see */
export function sortMembers(members: PluralMember[]): PluralMember[] {
  return [...members].sort((a, b) => memberName(a).toLowerCase().localeCompare(memberName(b).toLowerCase()));
}

/** Swaps a broken avatar for the site icon */
export function avatarFallback(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.src !== fallbackAvatar) image.src = fallbackAvatar;
}

export type Message = {
  type: "success" | "error";
  content: string;
} | null;

export function errorText(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
