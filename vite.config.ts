/* vite.config.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Runes everywhere except libraries
        runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
      },
      adapter: adapter(),
    }),
  ],
  // iconsax fetches its icon data relative to its own file, which pre-bundling breaks
  optimizeDeps: {
    exclude: ["iconsax"],
  },
});
