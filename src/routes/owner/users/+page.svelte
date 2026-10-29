<!-- src/routes/owner/users/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import { avatarFallback, errorText, fallbackAvatar, type Message as MessageType } from "#lib";
  import { authFetch } from "#lib/api.ts";
  import { auth } from "#lib/auth.svelte.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  type User = {
    id: string;
    username: string;
    display_name?: string;
    email?: string | null;
    is_admin: boolean;
    is_owner?: boolean;
    is_pet?: boolean;
    avatar_url?: string;
  };

  let users = $state<User[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  let creating = $state(false);
  let draft = $state({
    username: "",
    displayName: "",
    email: "",
    isAdmin: false,
    isPet: false,
  });

  let editingId = $state<string | null>(null);
  let edit = $state({
    displayName: "",
    email: "",
    avatarUrl: "",
    isAdmin: false,
    isPet: false,
  });

  const myId = $derived(auth.user?.id ?? "");

  async function fetchUsers() {
    try {
      const list = await authFetch<User[]>("/plural/users", {}, "Failed to fetch users");
      users = [...list].sort((a, b) => a.username.localeCompare(b.username));
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Network error occurred"),
      };
    }
  }

  onMount(() => {
    void fetchUsers().finally(() => (loading = false));
  });

  // Runs a change, reports it, and reloads the list
  async function run(action: () => Promise<unknown>, done: string, fallback: string): Promise<boolean> {
    saving = true;
    message = null;
    try {
      await action();
      message = {
        type: "success",
        content: done,
      };
      await fetchUsers();
      return true;
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, fallback),
      };
      return false;
    } finally {
      saving = false;
    }
  }

  async function createUser(event: SubmitEvent) {
    event.preventDefault();
    if (!draft.username.trim()) {
      message = {
        type: "error",
        content: "Username is required",
      };
      return;
    }

    const ok = await run(
      () =>
        authFetch(
          "/plural/users",
          {
            method: "POST",
            body: JSON.stringify({
              username: draft.username.trim(),
              display_name: draft.displayName.trim() || undefined,
              email: draft.email.trim() || undefined,
              is_admin: draft.isAdmin,
              is_pet: draft.isPet,
            }),
          },
          "Failed to create user",
        ),
      "User created. They can sign in once they authenticate with SSO under this username.",
      "Failed to create user",
    );
    if (ok) cancelCreate();
  }

  function cancelCreate() {
    creating = false;
    draft = {
      username: "",
      displayName: "",
      email: "",
      isAdmin: false,
      isPet: false,
    };
  }

  function startEditing(user: User) {
    editingId = user.id;
    edit = {
      displayName: user.display_name || "",
      email: user.email || "",
      avatarUrl: user.avatar_url || "",
      isAdmin: Boolean(user.is_admin),
      isPet: Boolean(user.is_pet),
    };
    message = null;
  }

  async function saveUser(user: User) {
    // Only the owner may change someone's email, and only when it actually changed
    const emailChange = auth.isOwner && edit.email.trim() !== (user.email || "") ? { email: edit.email.trim() || null } : {};

    const ok = await run(
      () =>
        authFetch(
          `/plural/users/${user.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              display_name: edit.displayName.trim() || null,
              avatar_url: edit.avatarUrl.trim() || null,
              is_admin: edit.isAdmin,
              is_pet: edit.isPet,
              ...emailChange,
            }),
          },
          "Failed to update user",
        ),
      `Updated @${user.username} successfully!`,
      "Failed to update user",
    );
    if (ok) editingId = null;
  }

  async function deleteUser(user: User) {
    if (user.id === myId) {
      message = {
        type: "error",
        content: "Cannot delete your own account",
      };
      return;
    }
    if (!confirm(`Delete user "${user.username}"? This action cannot be undone.`)) return;

    await run(
      () => authFetch(`/plural/users/${user.id}`, { method: "DELETE" }, "Failed to delete user"),
      "User deleted successfully!",
      "Failed to delete user",
    );
  }
</script>

<svelte:head>
  <title>User manager · Doughmination System</title>
</svelte:head>

<Protected owner>
  <div class="page">
    <PageHead
      eyebrow="Owner"
      title="User manager"
      subtitle="Manage system users, roles and permissions"
      back={{
        href: "/owner/dash",
        label: "Back to dashboard",
      }}
    />

    <Message {message} />

    {#if loading}
      <p class="muted">Loading…</p>
    {:else}
      {#if creating}
        <form class="panel stack" onsubmit={createUser}>
          <h2>Create new user</h2>
          <div class="grid2">
            <label class="field">
              <span>Username *</span>
              <input type="text" bind:value={draft.username} placeholder="Enter username" disabled={saving} />
            </label>
            <label class="field">
              <span>Display name</span>
              <input type="text" bind:value={draft.displayName} placeholder="Optional display name" disabled={saving} />
            </label>
          </div>
          <label class="field">
            <span>Email</span>
            <input type="email" bind:value={draft.email} placeholder="user@example.com" disabled={saving} />
            <small class="muted">
              Optional contact address. Sign-in is handled by SSO — this account links to the person the first time they
              log in under this username.
            </small>
          </label>
          <label class="check"><input type="checkbox" bind:checked={draft.isAdmin} disabled={saving} /> Admin privileges</label>
          <label class="check"><input type="checkbox" bind:checked={draft.isPet} disabled={saving} /> Pet role</label>
          <div class="buttons">
            <button type="submit" class="primary" disabled={saving}>{saving ? "Creating..." : "Create user"}</button>
            <button type="button" disabled={saving} onclick={cancelCreate}>Cancel</button>
          </div>
        </form>
      {:else}
        <div><button type="button" class="primary" onclick={() => (creating = true)}>
          <iconsax-icon name="user-add" type="bulk" size="16"></iconsax-icon>Create new user
        </button></div>
      {/if}

      <section class="panel">
        <h2>All users</h2>
        <p class="muted small">{users.length} user{users.length !== 1 ? "s" : ""} in the system · {users.filter((u) => u.is_admin).length} admin(s)</p>

        {#each users as user (user.id)}
          <div class="user">
            <div class="user-row">
              <img class="member-avatar avatar-sm" src={user.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
              <div class="grow">
                <p>
                  <strong>{user.display_name || user.username}</strong>
                  {#if user.is_owner}<span class="badge accent">Owner</span>{/if}
                  {#if user.is_admin}<span class="badge danger">Admin</span>{/if}
                  {#if user.is_pet}<span class="badge">Pet</span>{/if}
                  {#if user.id === myId}<span class="badge">You</span>{/if}
                </p>
                <p class="muted small">@{user.username} · {user.email || "no email on file"}</p>
              </div>
              <div class="buttons">
                <button type="button" class="small" disabled={saving} onclick={() => (editingId === user.id ? (editingId = null) : startEditing(user))}>
                  {editingId === user.id ? "Close" : "Edit"}
                </button>
                {#if user.id !== myId}
                  <button type="button" class="small danger" disabled={saving} onclick={() => deleteUser(user)}>Delete</button>
                {/if}
              </div>
            </div>

            {#if editingId === user.id}
              <div class="stack edit">
                <div class="grid2">
                  <label class="field">
                    <span>Display name</span>
                    <input type="text" bind:value={edit.displayName} placeholder="Display name" disabled={saving} />
                  </label>
                  <label class="field">
                    <span>Email</span>
                    <input type="email" bind:value={edit.email} placeholder="user@example.com" disabled={saving || !auth.isOwner} />
                  </label>
                </div>
                <label class="field">
                  <span>Avatar URL</span>
                  <input type="url" bind:value={edit.avatarUrl} placeholder="https://example.com/avatar.png" disabled={saving} />
                  <small class="muted">Avatars are external image links — no uploads</small>
                </label>
                <label class="check"><input type="checkbox" bind:checked={edit.isAdmin} disabled={saving} /> Admin privileges</label>
                <label class="check"><input type="checkbox" bind:checked={edit.isPet} disabled={saving} /> Pet role</label>
                <div class="buttons">
                  <button type="button" class="primary" disabled={saving} onclick={() => saveUser(user)}>{saving ? "Saving..." : "Save changes"}</button>
                  <button type="button" disabled={saving} onclick={() => (editingId = null)}>Cancel</button>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <p class="muted">No users found</p>
        {/each}
      </section>
    {/if}
  </div>
</Protected>

<style>
  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.15rem;
  }

  .user {
    padding: 0.75rem 0;
    border-top: 1px solid var(--line);
  }

  .user-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .user-row .badge {
    margin-left: 0.25rem;
  }

  .edit {
    margin-top: 0.75rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: rgb(0 0 0 / 20%);
  }
</style>
