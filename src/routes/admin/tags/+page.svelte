<!-- src/routes/admin/tags/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { PluralMember } from "doughmination-api/server";
  import { avatarFallback, errorText, fallbackAvatar, memberName, sortMembers, type Message as MessageType } from "#lib";
  import { authFetch, client } from "#lib/api.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";
  import MemberSelect from "#lib/components/MemberSelect.svelte";

  let members = $state<PluralMember[]>([]);
  let chosen = $state("");
  let newTag = $state("");
  let search = $state("");
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  const allTags = $derived([...new Set(members.flatMap((m) => m.tags ?? []))].sort((a, b) => a.localeCompare(b)));
  const selected = $derived(members.find((m) => m.name === chosen));
  const shown = $derived(
    members.filter((m) => {
      const query = search.toLowerCase();
      return memberName(m).toLowerCase().includes(query) || m.tags?.some((tag) => tag.toLowerCase().includes(query));
    }),
  );

  async function reload() {
    members = sortMembers(await client.getMembers());
  }

  onMount(() => {
    void reload().finally(() => (loading = false));
  });

  async function change(action: () => Promise<unknown>, done: string, fallback: string) {
    saving = true;
    message = null;
    try {
      await action();
      message = {
        type: "success",
        content: done,
      };
      await reload();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, fallback),
      };
    } finally {
      saving = false;
    }
  }

  async function addTag() {
    const tag = newTag.trim();
    if (!chosen || !tag) return;
    await change(
      () =>
        authFetch(
          `/plural/member-tags/${encodeURIComponent(chosen)}/add`,
          {
            method: "POST",
            body: JSON.stringify({ tag }),
          },
          "Failed to add tag",
        ),
      "Tag added successfully!",
      "Failed to add tag",
    );
    newTag = "";
  }

  async function removeTag(member: string, tag: string) {
    if (!confirm(`Remove tag "${tag}" from ${member}?`)) return;
    await change(
      () =>
        authFetch(
          `/plural/member-tags/${encodeURIComponent(member)}/${encodeURIComponent(tag)}`,
          { method: "DELETE" },
          "Failed to remove tag",
        ),
      "Tag removed successfully!",
      "Failed to remove tag",
    );
  }
</script>

<svelte:head>
  <title>Tag manager · Doughmination System</title>
</svelte:head>

<Protected admin>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Tag manager"
      subtitle="Manage member tags and sub-systems"
      back={{
        href: "/admin/dash",
        label: "Back to dashboard",
      }}
    />

    <Message {message} />

    {#if loading}
      <p class="muted">Loading…</p>
    {:else}
      <div class="two-col">
        <section class="panel">
          <h2>All members</h2>
          <p class="muted small">{members.filter((m) => m.tags?.length).length} member(s) with tags</p>
          <input type="text" placeholder="Search members or tags..." bind:value={search} />
          <div class="pick-list">
            {#each shown as member (member.id)}
              <div class="pick" class:selected={member.name === chosen}>
                <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
                <span class="grow">
                  <button type="button" class="link" onclick={() => (chosen = member.name ?? "")}>{memberName(member)}</button>
                  {#if member.tags?.length}
                    <span class="chips">
                      {#each member.tags as tag (tag)}
                        <span class="chip">
                          {tag}
                          <button type="button" class="x" title="Remove {tag}" disabled={saving} onclick={() => removeTag(member.name ?? "", tag)}>×</button>
                        </span>
                      {/each}
                    </span>
                  {:else}
                    <span class="muted small">No tags</span>
                  {/if}
                </span>
              </div>
            {:else}
              <p class="muted">{search ? "No members found matching your search" : "No members available"}</p>
            {/each}
          </div>
        </section>

        <div class="stack">
          <section class="panel">
            <h2>Add tag</h2>
            <MemberSelect id="member-select" label="Select member" {members} bind:value={chosen} note={(m) => (m.tags?.length ? ` (${m.tags.length} tag${m.tags.length !== 1 ? "s" : ""})` : "")} />

            {#if selected}
              <p class="muted small">Current tags:</p>
              <div class="chips">
                {#each selected.tags ?? [] as tag (tag)}
                  <span class="chip">{tag}</span>
                {:else}
                  <span class="muted small">No tags assigned</span>
                {/each}
              </div>

              <label class="field">
                <span>New tag</span>
                <input
                  type="text"
                  bind:value={newTag}
                  placeholder="Enter tag name..."
                  onkeydown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    void addTag();
                  }}
                />
              </label>
              {#if allTags.length}
                <p class="muted small">Or pick an existing tag:</p>
                <div class="chips">
                  {#each allTags as tag (tag)}
                    <button type="button" class="chip" class:active={newTag === tag} onclick={() => (newTag = tag)}>{tag}</button>
                  {/each}
                </div>
              {/if}
              <div>
                <button type="button" class="primary" disabled={saving || !newTag.trim()} onclick={addTag}>{saving ? "Adding..." : "Add tag"}</button>
              </div>
            {/if}
          </section>

          {#if allTags.length}
            <section class="panel">
              <h2>Tag statistics</h2>
              <p class="muted small">{allTags.length} unique tag{allTags.length !== 1 ? "s" : ""}</p>
              <div class="chips">
                {#each allTags as tag (tag)}
                  <span class="chip">{tag} <span class="muted">×{members.filter((m) => m.tags?.includes(tag)).length}</span></span>
                {/each}
              </div>
            </section>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</Protected>

<style>
  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.05rem;
  }

  .link {
    display: block;
    margin-bottom: 0.3rem;
    padding: 0;
    border: 0;
    background: none;
    font-weight: 600;
  }

  .x {
    padding: 0 0.15rem;
    border: 0;
    background: none;
    color: var(--bad);
    font-size: 0.9rem;
    line-height: 1;
  }
</style>
