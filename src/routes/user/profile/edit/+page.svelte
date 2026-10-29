<!-- src/routes/user/profile/edit/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { errorText, type Message as MessageType } from "#lib";
  import { authFetch } from "#lib/api.ts";
  import { auth } from "#lib/auth.svelte.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let displayName = $state("");
  let avatarUrl = $state("");
  let email = $state("");
  let seeded = false;
  let broken = $state(false);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  // Fill the form once the user has loaded
  $effect(() => {
    if (seeded || !auth.user) return;
    seeded = true;
    displayName = auth.user.display_name || "";
    avatarUrl = auth.user.avatar_url || "";
    email = auth.user.email || "";
  });

  const previewable = $derived(/^https?:\/\/[^\s/]+\.[^\s/]+/.test(avatarUrl.trim()) || avatarUrl.startsWith("/"));
  const avatarChanged = $derived(avatarUrl.trim() !== (auth.user?.avatar_url || ""));

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!auth.user) return;

    const trimmedEmail = email.trim();
    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      message = {
        type: "error",
        content: "Please enter a valid email address",
      };
      return;
    }

    saving = true;
    message = null;
    try {
      await authFetch(
        `/plural/users/${auth.user.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            display_name: displayName.trim() || null,
            avatar_url: avatarUrl.trim() || null,
            email: trimmedEmail || null,
          }),
        },
        "Failed to update profile",
      );
      message = {
        type: "success",
        content: "Profile updated successfully",
      };
      await auth.refresh();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to update profile"),
      };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Edit profile · Doughmination System</title>
</svelte:head>

<Protected>
  <div class="page narrow">
    <PageHead
      eyebrow="Account"
      title="Edit profile"
      subtitle="Update your profile information"
      back={{
        href: "/user/profile",
        label: "Cancel",
      }}
    />

    <Message {message} />
    <p class="notice">
      Sign-in is handled by SSO. Your username and password are managed by your SSO provider — this page only controls
      your display profile.
    </p>

    {#if auth.user}
      <form class="panel stack" onsubmit={save}>
        <div class="field">
          <span>Avatar</span>
          <div class="avatar-row">
            {#if avatarUrl && previewable && !broken}
              <img class="member-avatar preview" src={avatarUrl.trim()} alt="Avatar preview" onerror={() => (broken = true)} onload={() => (broken = false)} />
            {:else}
              <span class="preview placeholder"><iconsax-icon name="user" type="bulk" size="28"></iconsax-icon></span>
            {/if}
            <input
              id="avatarUrl"
              type="url"
              bind:value={avatarUrl}
              oninput={() => (broken = false)}
              placeholder="https://example.com/avatar.png"
            />
            {#if avatarChanged}
              <button type="button" class="small" onclick={() => (avatarUrl = auth.user?.avatar_url || "")}>Reset</button>
            {/if}
          </div>
          <small class="muted">Paste a direct link to an image (square recommended)</small>
        </div>

        <label class="field">
          <span>Display name</span>
          <input id="displayName" type="text" bind:value={displayName} placeholder="Enter display name" />
          <small class="muted">Leave blank to use username: @{auth.user.username}</small>
        </label>

        <label class="field">
          <span>Contact email</span>
          <input id="email" type="email" bind:value={email} placeholder="you@example.com" autocomplete="email" />
          <small class="muted">Optional contact address. Sign-in email lives with your SSO provider, not here.</small>
        </label>

        <div>
          <button type="submit" class="primary" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
        </div>
      </form>
    {/if}
  </div>
</Protected>

<style>
  .avatar-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .preview {
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
  }

  .placeholder {
    display: grid;
    place-items: center;
    border-radius: 0.75rem;
    background: var(--accent-dim);
    color: var(--accent);
  }
</style>
