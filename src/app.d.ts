/* src/app.d.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

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

  // Bindings; none yet beyond the static assets
  interface Env {
    ASSETS: Fetcher;
  }
}

// <iconsax-icon> is registered by `import "iconsax"` in src/hooks.client.ts
declare module "svelte/elements" {
  export interface SvelteHTMLElements {
    "iconsax-icon": HTMLAttributes<HTMLElement> & {
      name: string;
      type?: "bold" | "broken" | "bulk" | "linear" | "outline" | "twotone";
      size?: number | string;
      color?: string;
      pro?: boolean;
    };
  }
}

export {};
