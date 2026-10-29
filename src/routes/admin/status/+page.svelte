<!-- src/routes/admin/status/+page.svelte
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

  const EMOJI = ["💤", "🎮", "📚", "🎨", "🎵", "💻", "🌙", "☀️", "🍕", "☕", "🎬", "✨", "💭", "😴", "🏃", "🧘"];

  let members = $state<PluralMember[]>([]);
  let chosen = $state("");
  let text = $state("");
  let emoji = $state("");
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  const current = $derived(members.find((m) => m.name === chosen)?.status ?? null);
  const withStatus = $derived(members.filter((m) => m.status));

  async function reload() {
    members = sortMembers(await client.getMembers());
  }

  onMount(() => {
    void reload().finally(() => (loading = false));
  });

  // Picking a member fills the form with their current status
  $effect(() => {
    const status = members.find((m) => m.name === chosen)?.status;
    text = status?.text ?? "";
    emoji = status?.emoji ?? "";
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!chosen || !text.trim()) return;
    if (text.length > 100) {
      message = {
        type: "error",
        content: "Status must be ≤ 100 chars",
      };
      return;
    }

    saving = true;
    message = null;
    try {
      await client.setMemberStatus(chosen, {
        text: text.trim(),
        emoji: emoji || undefined,
      });
      message = {
        type: "success",
        content: "Status updated!",
      };
      await reload();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to update status"),
      };
    } finally {
      saving = false;
    }
  }

  async function clear() {
    if (!chosen || !confirm(`Clear status for ${chosen}?`)) return;

    saving = true;
    message = null;
    try {
      await authFetch(`/plural/members/${encodeURIComponent(chosen)}/status`, { method: "DELETE" }, "Failed to clear status");
      message = {
        type: "success",
        content: "Status cleared!",
      };
      await reload();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to clear status"),
      };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Status manager · Doughmination System</title>
</svelte:head>

<Protected admin>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Status manager"
      subtitle="Update member status messages"
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
        <form class="panel stack" onsubmit={save}>
          <MemberSelect id="member-select" label="Select member" {members} bind:value={chosen} note={(m) => (m.status ? " (has status)" : "")} />

          {#if chosen}
            <div class="field">
              <span>Emoji (optional)</span>
              <div class="row">
                <input class="emoji-input" type="text" bind:value={emoji} maxlength="2" placeholder="😊" />
                <div class="chips">
                  {#each EMOJI as suggestion (suggestion)}
                    <button type="button" class="chip" aria-label="Select emoji {suggestion}" onclick={() => (emoji = suggestion)}>{suggestion}</button>
                  {/each}
                </div>
              </div>
            </div>

            <label class="field">
              <span>Status text</span>
              <input type="text" bind:value={text} placeholder="What's happening?" maxlength="100" />
              <small class="muted">{text.length}/100 characters</small>
            </label>

            <div class="buttons">
              <button type="submit" class="primary" disabled={saving || !text.trim()}>{saving ? "Updating..." : "Update status"}</button>
              {#if current}
                <button type="button" class="danger" disabled={saving} onclick={clear}>Clear</button>
              {/if}
            </div>

            {#if current}
              <p class="notice">
                Current: {current.emoji ?? ""} {current.text}
                <br /><small class="muted">Updated {new Date(current.updated_at).toLocaleString()}</small>
              </p>
            {/if}
          {/if}
        </form>

        <section class="panel">
          <h2>Members with a status</h2>
          <p class="muted small">{withStatus.length} member(s) have status set</p>
          <div class="pick-list">
            {#each withStatus as member (member.id)}
              <button type="button" class="pick" class:selected={member.name === chosen} onclick={() => (chosen = member.name ?? "")}>
                <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
                <span class="grow">
                  <p>{memberName(member)}</p>
                  <p class="muted small">{member.status?.emoji ?? ""} {member.status?.text}</p>
                </span>
              </button>
            {:else}
              <p class="muted">No members have status set</p>
            {/each}
          </div>
        </section>
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

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
  }

  .emoji-input {
    width: 4rem;
    text-align: center;
  }
</style>
