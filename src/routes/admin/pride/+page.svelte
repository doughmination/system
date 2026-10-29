<!-- src/routes/admin/pride/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { PluralMember } from "doughmination-api/server";
  import { avatarFallback, errorText, fallbackAvatar, memberName, sortMembers, type Message as MessageType } from "#lib";
  import { client } from "#lib/api.ts";
  import { PRIDE_FLAGS } from "#lib/pride.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";
  import MemberSelect from "#lib/components/MemberSelect.svelte";
  import PrideSwatch from "#lib/components/PrideSwatch.svelte";

  let members = $state<PluralMember[]>([]);
  let chosen = $state("");
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  const selected = $derived(members.find((m) => m.name === chosen));
  const selectedPride = $derived(selected?.pride ?? []);

  async function reload() {
    members = sortMembers(await client.getMembers());
  }

  onMount(() => {
    void reload().finally(() => (loading = false));
  });

  async function change(identity: string, action: "add" | "remove") {
    if (!chosen) return;
    saving = true;
    message = null;
    try {
      if (action === "add") await client.addMemberPride(chosen, identity);
      else await client.removeMemberPride(chosen, identity);
      await reload();
      message = {
        type: "success",
        content: action === "add" ? "Pride identity added!" : "Pride identity removed!",
      };
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to update pride identity"),
      };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Pride manager · Doughmination System</title>
</svelte:head>

<Protected owner>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Pride manager"
      subtitle="Assign pride identities to members"
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
          <p class="muted small">{members.filter((m) => m.pride?.length).length} member(s) with pride identities</p>
          <div class="pick-list">
            {#each members as member (member.id)}
              <button type="button" class="pick" class:selected={member.name === chosen} onclick={() => (chosen = member.name ?? "")}>
                <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
                <span class="grow">
                  <p>{memberName(member)}</p>
                  {#if member.pride?.length}
                    <span class="chips">
                      {#each member.pride as identity (identity)}
                        <span class="chip"><PrideSwatch label={identity} />{identity}</span>
                      {/each}
                    </span>
                  {:else}
                    <p class="muted small">No pride identities</p>
                  {/if}
                </span>
              </button>
            {/each}
          </div>
        </section>

        <section class="panel">
          <h2>Set pride identities</h2>
          <MemberSelect id="member-select" label="Select member" {members} bind:value={chosen} note={(m) => (m.pride?.length ? ` (${m.pride.length})` : "")} />

          {#if selected}
            {#if selectedPride.length}
              <p class="muted small">Current identities:</p>
              <div class="chips">
                {#each selectedPride as identity (identity)}
                  <span class="chip active">
                    <PrideSwatch label={identity} />{identity}
                    <button type="button" class="x" title="Remove {identity}" disabled={saving} onclick={() => change(identity, "remove")}>×</button>
                  </span>
                {/each}
              </div>
            {/if}
            <p class="muted small">Add an identity:</p>
            <div class="chips">
              {#each PRIDE_FLAGS.filter((flag) => !selectedPride.includes(flag.label)) as flag (flag.label)}
                <button type="button" class="chip" disabled={saving} onclick={() => change(flag.label, "add")}>
                  <PrideSwatch label={flag.label} />{flag.label}
                </button>
              {/each}
            </div>
          {/if}
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

  .x {
    padding: 0 0.15rem;
    border: 0;
    background: none;
    color: inherit;
    line-height: 1;
  }
</style>
