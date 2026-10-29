<!-- src/routes/user/login/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { page } from "$app/state";
  import { client } from "#lib/api.ts";

  let redirecting = $state(false);

  // /admin/login is an alias for the dashboard, kept for old bookmarks
  const rawFrom = $derived(page.url.searchParams.get("from") || "/");
  const from = $derived(rawFrom === "/admin/login" ? "/admin/dash" : rawFrom);
  const error = $derived(page.url.searchParams.get("error"));

  // A full navigation: the API redirects to the SSO, which comes back to /user/login/callback
  function signIn() {
    redirecting = true;
    location.href = client.pocketIdLoginUrl(from);
  }
</script>

<svelte:head>
  <title>Sign in · Doughmination System</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page narrow">
  <section class="panel">
    <p class="eyebrow">Account</p>
    <h1>Sign in</h1>
    <p class="muted">Use your SSO account to continue.</p>
    {#if error}
      <p class="notice error">{error}</p>
    {/if}
    <div>
      <button type="button" class="primary" disabled={redirecting} onclick={signIn}>
        <iconsax-icon name="key" type="bulk" size="18"></iconsax-icon>
        {redirecting ? "Redirecting to SSO…" : "Sign in with SSO"}
      </button>
    </div>
    <p class="muted small">You'll be taken to your SSO provider to sign in, then brought right back here.</p>
  </section>
</div>

<style>
  p {
    margin: 0;
  }
</style>
