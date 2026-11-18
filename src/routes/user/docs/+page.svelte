<!-- src/routes/user/docs/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.2 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import { errorText, type Message as MessageType } from "#lib";
  import { authFetch } from "#lib/api.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  interface Operation {
    summary?: string;
    tags?: string[];
    security?: unknown[];
  }

  interface Endpoint {
    method: string;
    path: string;
    summary: string;
    signedIn: boolean;
  }

  let spec = $state<{ paths: Record<string, Record<string, Operation>> } | null>(null);
  let message = $state<MessageType>(null);

  // Endpoints grouped by their first tag, in spec order
  const groups = $derived.by(() => {
    const byTag = new Map<string, Endpoint[]>();
    for (const [path, methods] of Object.entries(spec?.paths ?? {})) {
      for (const [method, operation] of Object.entries(methods)) {
        const tag = operation.tags?.[0] ?? "Other";
        const list = byTag.get(tag) ?? [];
        list.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary ?? "",
          signedIn: Boolean(operation.security?.length),
        });
        byTag.set(tag, list);
      }
    }
    return [...byTag];
  });

  function download() {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "openapi.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  onMount(async () => {
    try {
      spec = await authFetch("/openapi.json", {}, "Failed to load the API spec");
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to load the API spec"),
      };
    }
  });
</script>

<svelte:head>
  <title>API docs · Doughmination System</title>
</svelte:head>

<Protected>
  <div class="page">
    <PageHead
      eyebrow="// system.api"
      title="API docs"
      subtitle="Every endpoint on this site"
      back={{
        href: "/",
        label: "Back to home",
      }}
    />

    <Message {message} />

    {#if spec}
      <div class="buttons">
        <button type="button" onclick={download}>Download openapi.json</button>
      </div>

      {#each groups as [tag, endpoints] (tag)}
        <section class="panel">
          <h2>{tag}</h2>
          <ul class="endpoints">
            {#each endpoints as endpoint (endpoint.method + endpoint.path)}
              <li>
                <span class="badge">{endpoint.method}</span>
                <code>{endpoint.path}</code>
                {#if endpoint.signedIn}<span class="badge accent">Sign-in</span>{/if}
                <span class="muted">{endpoint.summary}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {:else if !message}
      <p class="muted">Loading the API spec…</p>
    {/if}
  </div>
</Protected>

<style>
  .endpoints {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .endpoints li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
  }

  .endpoints code {
    overflow-wrap: anywhere;
  }
</style>
