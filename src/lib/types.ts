/* src/lib/types.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

// The shapes this site's own /api/plural sends back

export interface PluralProxyTag {
  prefix: string | null;
  suffix: string | null;
}

export interface PluralMemberStatus {
  text: string;
  emoji: string | null;
  updated_at: string;
}

export interface PluralMember {
  id: string;
  uuid?: string;
  name?: string;
  display_name?: string | null;
  // Hex without the "#"
  color?: string | null;
  // "YYYY-MM-DD"; year 0004 means the year is hidden
  birthday?: string | null;
  pronouns?: string | null;
  avatar_url?: string | null;
  webhook_avatar_url?: string | null;
  banner?: string | null;
  description?: string | null;
  created?: string | null;
  proxy_tags?: PluralProxyTag[];
  keep_proxy?: boolean;
  autoproxy_enabled?: boolean | null;
  tags?: string[];
  pride?: string[];
  status?: PluralMemberStatus | null;
  is_special?: boolean;
  original_name?: string;
  [key: string]: unknown;
}

// `members` is missing, not empty, when nobody is fronting
export interface FrontersResponse {
  timestamp?: string;
  members?: PluralMember[];
  [key: string]: unknown;
}

export interface MentalState {
  level: string;
  updated_at: string;
  notes?: string | null;
}

export interface PluralSystem {
  id?: string;
  uuid?: string;
  name?: string | null;
  description?: string | null;
  tag?: string | null;
  avatar_url?: string | null;
  banner?: string | null;
  color?: string | null;
  created?: string | null;
  timezone?: string | null;
  mental_state?: MentalState;
  [key: string]: unknown;
}

export interface MemberStatusResponse {
  success: boolean;
  member_identifier: string;
  status: PluralMemberStatus | null;
}

export interface UserResponse {
  id: string;
  username: string;
  display_name?: string | null;
  email?: string | null;
  email_verified?: boolean;
  pending_email?: string | null;
  created_at?: string | null;
  is_admin: boolean;
  is_owner: boolean;
  is_pet: boolean;
  avatar_url?: string | null;
}

export interface Relationship {
  id: string;
  members: [string, string];
  type: string;
  since: string | null;
}

export interface RelationshipsResponse {
  status: string;
  relationships: Relationship[];
}

export interface SwitchResponse {
  status?: string;
  success?: boolean;
  message?: string;
  count?: number;
  [key: string]: unknown;
}
