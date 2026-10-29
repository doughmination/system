<!-- src/lib/components/Protected.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import type { Snippet } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { auth } from "#lib/auth.svelte.ts";

  // Owner passes every check, as before
  let {
    admin = false,
    owner = false,
    pet = false,
    children,
  }: {
    admin?: boolean;
    owner?: boolean;
    pet?: boolean;
    children: Snippet;
  } = $props();

  const denied = $derived.by(() => {
    if (owner && !auth.isOwner) return "Owner";
    if (admin && !auth.isAdmin && !auth.isOwner) return "Admin";
    if (pet && !auth.isPet && !auth.isOwner) return "Pet";
    return null;
  });

  $effect(() => {
    if (auth.ready && !auth.signedIn) {
      void goto(`/user/login?from=${encodeURIComponent(page.url.pathname)}`, { replace: true });
    }
  });
</script>

{#if !auth.ready}
  <div class="page narrow"><p class="muted">Verifying access…</p></div>
{:else if auth.signedIn && denied}
  <div class="page narrow">
    <section class="panel">
      <p class="eyebrow">Restricted</p>
      <h1>{denied} access required</h1>
      <p class="muted">This area is restricted to {denied === "Owner" ? "system owners" : `${denied.toLowerCase()}s`} only.</p>
      <div>
        <button type="button" onclick={() => history.back()}>
          <iconsax-icon name="arrow-left-01" type="bulk" size="16"></iconsax-icon>Go back
        </button>
      </div>
    </section>
  </div>
{:else if auth.signedIn}
  {@render children()}
{/if}

<style>
  h1,
  p {
    margin: 0;
  }
</style>
