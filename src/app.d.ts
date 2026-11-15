/* src/app.d.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

/// <reference types="unplugin-icons/types/svelte5" />

import type { PluralEnv } from "#lib/server/plural/types.ts";

declare global {
  namespace App {
    interface Error {
      message: string;
      title?: string;
    }

    interface Platform {
      env: Env;
      ctx: ExecutionContext;
    }
  }

  // Static assets plus the plural API's bindings, vars and secrets
  interface Env extends PluralEnv {
    ASSETS: Fetcher;
  }
}

export {};
