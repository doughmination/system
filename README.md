# Doughmination System

A real-time plural system tracker for the Doughmination System — current fronters,
system members, and switching patterns. Member data is pulled live from PluralKit
through the Doughmination API, so pages render fresh on every request.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5)
- Plain CSS, shared with [doughmination.gay](https://doughmination.gay)
- `doughmination-api/server`'s typed client for data, plus its live socket
- Deployed to **Cloudflare Workers** via `@sveltejs/adapter-cloudflare`

## Local development

```bash
bun install
bun run dev
```

Runs the Vite dev server at http://localhost:5173.

To preview in the real Workers runtime (closer to production):

```bash
bun run preview
```

## Deploy

```bash
bun run deploy
```

This runs `vite build` and then `wrangler deploy`. Worker config lives in
[`wrangler.jsonc`](./wrangler.jsonc). Member pages (`/[member_id]`) are
server-rendered on demand so Discord embeds and live data stay current with no
rebuild; signed-in pages (`/user`, `/admin`, `/owner`) render in the browser,
since the API token lives in `localStorage`.

## Scripts

| Script            | Description                                |
| ----------------- | ------------------------------------------ |
| `bun run dev`     | Vite dev server                            |
| `bun run build`   | Production build for Workers               |
| `bun run preview` | Build + serve in the local Workers runtime |
| `bun run deploy`  | Build + deploy to Cloudflare Workers       |
| `bun run check`   | svelte-check type checking                 |
