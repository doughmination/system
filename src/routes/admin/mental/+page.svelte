<!-- src/routes/admin/mental/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { MentalState } from "doughmination-api/server";
  import { errorText, type Message as MessageType } from "#lib";
  import { client } from "#lib/api.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  const OPTIONS = [
    {
      value: "safe",
      label: "Safe",
      icon: "tick-circle",
    },
    {
      value: "unstable",
      label: "Unstable",
      icon: "danger",
    },
    {
      value: "idealizing",
      label: "Idealizing",
      icon: "info-circle",
    },
    {
      value: "self-harming",
      label: "Self-Harming",
      icon: "warning-2",
    },
    {
      value: "highly at risk",
      label: "Highly At Risk",
      icon: "shield-cross",
    },
  ];

  let current = $state<MentalState | null>(null);
  let level = $state("");
  let notes = $state("");
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  const currentOption = $derived(OPTIONS.find((o) => o.value === current?.level));

  onMount(async () => {
    try {
      current = await client.getMentalState();
      level = current.level;
      notes = current.notes || "";
    } catch {
      // No state yet; the form still works
    } finally {
      loading = false;
    }
  });

  async function update() {
    saving = true;
    message = null;
    try {
      await client.setMentalState({
        level,
        notes: notes.trim() || undefined,
      });
      current = await client.getMentalState();
      message = {
        type: "success",
        content: "Mental state updated successfully.",
      };
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "An unknown error occurred"),
      };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Mental health · Doughmination System</title>
</svelte:head>

<Protected admin>
  <div class="page narrow">
    <PageHead
      eyebrow="Admin"
      title="Mental health"
      subtitle="Update system mental state"
      back={{
        href: "/admin/dash",
        label: "Back to dashboard",
      }}
    />

    <Message {message} />

    {#if loading}
      <p class="muted">Loading…</p>
    {:else}
      {#if current && currentOption}
        <div class="mental mental-{current.level.replaceAll(' ', '-')}">
          <iconsax-icon name={currentOption.icon} type="bulk" size="32"></iconsax-icon>
          <div>
            <p class="mental-label">{currentOption.label}</p>
            {#if current.notes}<p>{current.notes}</p>{/if}
            <small class="muted">Last updated: {new Date(current.updated_at).toLocaleString()}</small>
          </div>
        </div>
      {/if}

      <section class="panel stack">
        <label class="field">
          <span>Mental state level</span>
          <select bind:value={level}>
            <option value="">-- Select mental state --</option>
            {#each OPTIONS as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>
        <label class="field">
          <span>Notes (optional)</span>
          <textarea class="notes" rows="3" bind:value={notes} placeholder="Add any additional notes about the current mental state..."></textarea>
        </label>
        <div>
          <button type="button" class="primary" disabled={saving || !level} onclick={update}>
            {saving ? "Updating..." : "Update mental state"}
          </button>
        </div>
      </section>
    {/if}
  </div>
</Protected>

<style>
  /* Prose, not code: the shared textarea style is monospace */
  .notes {
    min-height: 6rem;
    font-family: inherit;
    font-size: 1rem;
  }
</style>
