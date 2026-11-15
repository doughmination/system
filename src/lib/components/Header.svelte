<!-- src/lib/components/Header.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import IcLogin from "~icons/ic/outline-login";
  import IcLogout from "~icons/ic/outline-logout";
  import IcPerson from "~icons/ic/outline-person";
  import IcPublic from "~icons/ic/outline-public";
  import IcSettings from "~icons/ic/outline-settings";
  import IcWorkspacePremium from "~icons/ic/outline-workspace-premium";
  import "#lib/styles/header.css";
  import { goto } from "$app/navigation";
  import { fallbackAvatar } from "#lib";
  import { auth } from "#lib/auth.svelte.ts";

  async function signOut() {
    const endSession = await auth.signOut();
    if (endSession) location.href = endSession;
    else await goto("/");
  }
</script>

<!-- Fixed-height page backdrop, so every page gets the same amount of background -->
<div class="backdrop" aria-hidden="true"></div>

<header>
  <a class="brand" href="/">
    <img src={fallbackAvatar} alt="" width="32" height="32" />
    <span>Doughmination System®</span>
  </a>

  <nav>
    {#if auth.signedIn}
      <span class="who">Signed in as <strong>{auth.displayName}</strong></span>
    {/if}
    {#if auth.signedIn}
      {#if auth.isOwner}
        <a href="/owner/dash">
          <IcWorkspacePremium width="24" height="24" class="nav-icon" />Owner
        </a>
      {/if}
      {#if auth.isAdmin}
        <a href="/admin/dash">
          <IcSettings width="24" height="24" class="nav-icon" />Admin
        </a>
      {/if}
      <a href="/user/dash">
        <IcPublic width="24" height="24" class="nav-icon" />Public
      </a>
      <a href="/user/profile">
        <IcPerson width="24" height="24" class="nav-icon" />Profile
      </a>
      <button type="button" class="nav-button" onclick={signOut}>
        <IcLogout width="24" height="24" class="nav-icon" />Sign out
      </button>
    {:else if auth.ready}
      <a href="/user/login">
        <IcLogin width="24" height="24" class="nav-icon" />Sign in
      </a>
    {/if}
  </nav>
</header>

<style>
  nav {
    flex-wrap: wrap;
    align-items: center;
  }

  .who {
    color: var(--muted);
  }

  .who strong {
    color: var(--accent);
    font-weight: 600;
  }

  /* A button that reads as one of the header's links */
  .nav-button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--muted);
    font-size: inherit;
  }

  .nav-button:hover:not(:disabled) {
    color: var(--text);
  }
</style>
