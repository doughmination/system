/* src/routes/relationships/+page.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { PageLoad } from "./$types";
import { publicClient } from "#lib/api.ts";

export const load: PageLoad = async ({ fetch, depends }) => {
  depends("api:public");
  const api = publicClient(fetch);

  const [members, relationships] = await Promise.all([
    api.getMembers().catch(() => []),
    api.getRelationships().catch(() => null),
  ]);

  return {
    members,
    relationships: relationships?.relationships ?? [],
  };
};
