/* src/lib/server/plural/services/media.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { frontendUrl } from "../config";

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

export function mediaUrl(key: string): string {
  return `${frontendUrl()}/api/plural/media/${key}`;
}
