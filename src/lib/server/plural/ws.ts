/* src/lib/server/plural/ws.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

// Live events go out on the api Worker's /v2/ws hub, which every site already listens to
import { rt } from "./runtime";

export function broadcastFrontingUpdate(frontersData: unknown): Promise<void> {
  return rt().broadcast({
    type: "fronters_update",
    data: frontersData,
  });
}

export function broadcastMentalStateUpdate(stateData: unknown): Promise<void> {
  return rt().broadcast({
    type: "mental_state_update",
    data: stateData,
  });
}

export function broadcastFrontendUpdate(updateType: string, data: unknown): Promise<void> {
  return rt().broadcast({
    type: updateType,
    data,
  });
}
