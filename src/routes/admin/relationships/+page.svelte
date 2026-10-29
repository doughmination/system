<!-- src/routes/admin/relationships/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { PluralMember, Relationship } from "doughmination-api/server";
  import { errorText, memberName, sortMembers, type Message as MessageType } from "#lib";
  import { client } from "#lib/api.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";
  import MemberSelect from "#lib/components/MemberSelect.svelte";

  const TYPES = ["partner", "spouse", "queerplatonic", "datemate", "crush"];

  let members = $state<PluralMember[]>([]);
  let relationships = $state<Relationship[]>([]);
  let memberA = $state("");
  let memberB = $state("");
  let type = $state("partner");
  let since = $state("");
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  function labelFor(identifier: string): string {
    const member = members.find((m) => m.id === identifier || m.name === identifier);
    return member ? memberName(member) : identifier;
  }

  async function reload() {
    relationships = (await client.getRelationships()).relationships ?? [];
  }

  onMount(async () => {
    try {
      members = sortMembers(await client.getMembers());
      await reload();
    } finally {
      loading = false;
    }
  });

  async function add() {
    message = null;
    if (!memberA || !memberB) {
      message = {
        type: "error",
        content: "Pick two members",
      };
      return;
    }
    if (memberA === memberB) {
      message = {
        type: "error",
        content: "Pick two different members",
      };
      return;
    }

    saving = true;
    try {
      await client.addRelationship({
        memberA,
        memberB,
        type,
        since: since || null,
      });
      memberA = "";
      memberB = "";
      since = "";
      type = "partner";
      message = {
        type: "success",
        content: "Relationship added!",
      };
      await reload();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to add relationship"),
      };
    } finally {
      saving = false;
    }
  }

  async function remove(edge: Relationship) {
    const pair = `${labelFor(edge.members[0])} & ${labelFor(edge.members[1])}`;
    if (!confirm(`Remove the relationship between ${pair}?`)) return;

    saving = true;
    message = null;
    try {
      await client.removeRelationship(edge.id);
      message = {
        type: "success",
        content: "Relationship removed!",
      };
      await reload();
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to remove relationship"),
      };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Relationship manager · Doughmination System</title>
</svelte:head>

<Protected owner>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Relationship manager"
      subtitle="Map who is dating who across the system"
      back={{
        href: "/admin/dash",
        label: "Back to dashboard",
      }}
    />
    <div><a class="btn" href="/relationships"><iconsax-icon name="lovely" type="bulk" size="16"></iconsax-icon>View map</a></div>

    <Message {message} />

    {#if loading}
      <p class="muted">Loading…</p>
    {:else}
      <div class="two-col">
        <section class="panel">
          <h2>All relationships</h2>
          <p class="muted small">{relationships.length} link{relationships.length !== 1 ? "s" : ""}</p>
          {#each relationships as edge (edge.id)}
            <div class="edge">
              <div class="grow">
                <p>{labelFor(edge.members[0])} &amp; {labelFor(edge.members[1])}</p>
                <p class="muted small">{edge.type}{edge.since ? ` · since ${edge.since}` : ""}</p>
              </div>
              <button type="button" class="small danger" disabled={saving} onclick={() => remove(edge)}>Remove</button>
            </div>
          {:else}
            <p class="muted">No relationships yet</p>
          {/each}
        </section>

        <section class="panel">
          <h2>Add relationship</h2>
          <p class="muted small">Link two members. A member can have many.</p>
          <MemberSelect id="member-a" label="First member" {members} bind:value={memberA} by="id" />
          <MemberSelect id="member-b" label="Second member" {members} bind:value={memberB} by="id" />
          <label class="field">
            <span>Type</span>
            <select bind:value={type}>
              {#each TYPES as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <label class="field">
            <span>Since (optional)</span>
            <input type="date" bind:value={since} />
          </label>
          <div>
            <button type="button" class="primary" disabled={saving || !memberA || !memberB} onclick={add}>
              {saving ? "Adding..." : "Add relationship"}
            </button>
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

  .edge {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.6rem 0;
    border-top: 1px solid var(--line);
  }
</style>
