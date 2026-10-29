<!-- src/routes/user/profile/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { auth } from "#lib/auth.svelte.ts";
  import Protected from "#lib/components/Protected.svelte";

  let broken = $state(false);
</script>

<svelte:head>
  <title>Profile · Doughmination System</title>
</svelte:head>

<Protected>
  <div class="page narrow">
    <section class="panel profile">
      <p class="eyebrow">Account</p>
      {#if auth.user}
        {#if auth.user.avatar_url && !broken}
          <img class="member-avatar avatar" src={auth.user.avatar_url} alt="" onerror={() => (broken = true)} />
        {:else}
          <span class="avatar placeholder"><iconsax-icon name="user" type="bulk" size="48"></iconsax-icon></span>
        {/if}
        <h1>{auth.user.display_name || auth.user.username}</h1>
        <p class="chips">
          {#if auth.user.is_owner}<span class="badge accent">Owner</span>{/if}
          {#if auth.user.is_admin}<span class="badge">Admin</span>{/if}
          {#if auth.user.is_pet}<span class="badge">Pet</span>{/if}
        </p>
        <p class="muted">@{auth.user.username}</p>
        <div class="buttons">
          <a class="btn primary" href="/user/profile/edit">Edit profile</a>
          <a class="btn" href="/">Back to home</a>
        </div>
      {:else}
        <p class="muted">User data not available.</p>
        <div><a class="btn" href="/">Back to home</a></div>
      {/if}
    </section>
  </div>
</Protected>

<style>
  .profile {
    align-items: center;
    text-align: center;
  }

  h1,
  p {
    margin: 0;
  }

  .avatar {
    width: 7rem;
    height: 7rem;
  }

  .placeholder {
    display: grid;
    place-items: center;
    border-radius: 1rem;
    background: var(--accent-dim);
    color: var(--accent);
  }
</style>
