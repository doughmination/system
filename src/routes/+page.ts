/* src/routes/+page.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import type { PageLoad } from "./$types";
import { publicClient } from "#lib/api.ts";

// Rendered on the server for search engines and link previews, then kept live by the socket
export const load: PageLoad = async ({ fetch, depends }) => {
  depends("api:public");
  const api = publicClient(fetch);

  const [members, fronters, system] = await Promise.all([
    api.getMembers().catch(() => []),
    api.getFronters().catch(() => null),
    api.getSystem().catch(() => null),
  ]);

  return {
    members,
    fronters,
    system,
  };
};
