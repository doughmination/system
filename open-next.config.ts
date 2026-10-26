/* system/open-next.config.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/* No incremental (ISR) cache override: member data comes live from PluralKit
 * via the API, so we want each request to re-render fresh rather than serve a
 * cached page. To add persistent caching later, provision an R2 bucket and set
 * `incrementalCache: r2IncrementalCache` (import from
 * "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache"). */
const config = defineCloudflareConfig({});

/* `bun run build` is `opennextjs-cloudflare build` (so Cloudflare Workers Builds
 * produce .open-next/ for `wrangler deploy`). OpenNext's default buildCommand is
 * `npm run build`, which would recurse — point it at the plain Next build. */
config.buildCommand = "bun run build:next";

export default config;
