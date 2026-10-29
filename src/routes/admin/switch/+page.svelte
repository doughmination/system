<!-- src/routes/admin/switch/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { PluralMember } from "doughmination-api/server";
  import { avatarFallback, errorText, fallbackAvatar, memberName, sortMembers, type Message as MessageType } from "#lib";
  import { client } from "#lib/api.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  let members = $state<PluralMember[]>([]);
  let fronters = $state<PluralMember[]>([]);
  let selected = $state(new Set<string>());
  let search = $state("");
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  const shown = $derived(
    members.filter((m) => {
      const query = search.toLowerCase();
      return memberName(m).toLowerCase().includes(query) || m.tags?.some((tag) => tag.toLowerCase().includes(query));
    }),
  );

  const changed = $derived.by(() => {
    const current = new Set(fronters.map((m) => m.id));
    if (current.size !== selected.size) return true;
    return [...selected].some((id) => !current.has(id));
  });

  async function loadFronters() {
    fronters = (await client.getFronters()).members ?? [];
  }

  onMount(async () => {
    try {
      members = sortMembers(await client.getMembers());
      await loadFronters();
      selected = new Set(fronters.map((m) => m.id));
    } finally {
      loading = false;
    }
  });

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected = next;
  }

  async function apply() {
    if (selected.size === 0) {
      message = {
        type: "error",
        content: "Please select at least one member",
      };
      return;
    }
    saving = true;
    message = null;
    try {
      const result = await client.multiSwitch([...selected]);
      const count = result.count ?? selected.size;
      message = {
        type: "success",
        content: `Successfully switched to ${count} member${count !== 1 ? "s" : ""}!`,
      };
      await loadFronters();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to switch fronters"),
      };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Switch manager · Doughmination System</title>
</svelte:head>

<Protected admin>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Switch manager"
      subtitle="Manage fronting members"
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
          <input type="text" placeholder="Search members..." bind:value={search} />
          <div class="buttons">
            <button type="button" class="small" disabled={shown.length === 0} onclick={() => (selected = new Set(shown.map((m) => m.id)))}>Select all</button>
            <button type="button" class="small" disabled={selected.size === 0} onclick={() => (selected = new Set())}>Clear all</button>
            <span class="muted small">{selected.size} selected</span>
          </div>
          <div class="pick-list">
            {#each shown as member (member.id)}
              <button type="button" class="pick" class:selected={selected.has(member.id)} onclick={() => toggle(member.id)}>
                <input type="checkbox" checked={selected.has(member.id)} tabindex="-1" />
                <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
                <span class="grow">
                  <p>
                    {memberName(member)}
                    {#if fronters.some((f) => f.id === member.id)}<span class="badge accent">fronting</span>{/if}
                  </p>
                  {#if member.pronouns}<p class="muted small">{member.pronouns}</p>{/if}
                </span>
              </button>
            {:else}
              <p class="muted">{search ? "No members found matching your search" : "No members available"}</p>
            {/each}
          </div>
        </section>

        <div class="stack">
          <section class="panel">
            <h2>Currently fronting</h2>
            {#each fronters as member (member.id)}
              <div class="with-icon"><img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />{memberName(member)}</div>
            {:else}
              <p class="muted">No one currently fronting</p>
            {/each}
          </section>

          <section class="panel">
            <h2>Selected</h2>
            <p class="muted small">{selected.size} member{selected.size !== 1 ? "s" : ""} selected</p>
            {#each members.filter((m) => selected.has(m.id)) as member (member.id)}
              <div class="with-icon">
                <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
                <span class="grow">{memberName(member)}</span>
                <button type="button" class="small" title="Remove" onclick={() => toggle(member.id)}>×</button>
              </div>
            {/each}
          </section>

          <button type="button" class="primary" disabled={saving || selected.size === 0 || !changed} onclick={apply}>
            {saving ? "Switching..." : changed ? "Apply switch" : "No changes"}
          </button>
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

  .pick input {
    pointer-events: none;
  }
</style>
