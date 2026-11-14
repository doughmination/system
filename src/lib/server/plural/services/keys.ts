/* src/lib/server/plural/services/keys.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

/**
 * Manual API-key verification (bot token).
 *
 * These keys are now set MANUALLY as secrets/vars — nothing is generated on
 * first run and there is no longer a regenerate flow. Verification is a
 * constant-time comparison against the configured value(s).
 *   - Bot token:  DOUGH_BOT_TOKEN
 */

import { rt } from "../runtime";
import { constantTimeStringEqual } from "../security";

// ---- Bot token ------------------------------------------------------------

export function verifyBotToken(providedToken: string): boolean {
  const configured = rt().env.DOUGH_BOT_TOKEN;
  if (!configured || !providedToken) return false;
  return constantTimeStringEqual(configured, providedToken);
}
