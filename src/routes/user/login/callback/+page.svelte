<!-- src/routes/user/login/callback/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "#lib/auth.svelte.ts";

  let error = $state<string | null>(null);

  // Only same-site app paths: never "//host" or a full URL
  function safeFrom(raw: string | null): string {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
    return raw;
  }

  // The API puts the token in the fragment (#token=…&from=…), which never reaches a server log
  onMount(() => {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));

    const failure = params.get("error");
    if (failure) {
      error = failure;
      return;
    }

    const token = params.get("token");
    if (!token) {
      error = "No sign-in token was returned. Please try again.";
      return;
    }

    auth.signIn(token);
    // Strip the token from the address bar before moving on
    history.replaceState(null, "", location.pathname);
    void goto(safeFrom(params.get("from")), { replace: true });
  });
</script>

<svelte:head>
  <title>Signing in · Doughmination System</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page narrow">
  <section class="panel">
    {#if error}
      <h1>Sign-in failed</h1>
      <p class="notice error">{error}</p>
      <div><a class="btn" href="/user/login">Back to sign in</a></div>
    {:else}
      <p class="muted">Signing you in…</p>
    {/if}
  </section>
</div>

<style>
  h1,
  p {
    margin: 0;
  }
</style>
