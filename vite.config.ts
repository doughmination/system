/* vite.config.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Runes everywhere except libraries
        runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
      },
      adapter: adapter(),
      // /api is bearer-token only (no cookies) and the site has no form actions, so the origin check guards nothing
      // and would block body-less calls from the app and other sites
      csrf: {
        trustedOrigins: ["*"],
      },
    }),
    // Turns each `~icons/<set>/<name>` import into an inline-SVG Svelte component at build time
    Icons({
      compiler: "svelte",
      scale: 1,
    }),
  ],
});
