<!-- src/lib/components/Home.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import type { FrontersResponse, PluralMember, PluralSystem } from "doughmination-api/server";
  import { replaceState } from "$app/navigation";
  import { page } from "$app/state";
  import { avatarFallback, fallbackAvatar, memberName, sortMembers, siteUrl } from "#lib";
  import { normalizeColor, readableOnDark } from "#lib/colour.ts";
  import { live } from "#lib/live.svelte.ts";
  import PrideSwatch from "#lib/components/PrideSwatch.svelte";
  import DiscordEmbed from "#lib/components/DiscordEmbed.svelte";

  let {
    members: rawMembers,
    fronters,
    system,
  }: {
    members: PluralMember[];
    fronters: FrontersResponse | null;
    system: PluralSystem | null;
  } = $props();

  const MENTAL_LABELS: Record<string, string> = {
    safe: "Safe",
    unstable: "Unstable",
    idealizing: "Idealizing",
    "self-harming": "Self-Harming",
    "highly at risk": "Highly At Risk",
  };

  const MENTAL_ICONS: Record<string, string> = {
    safe: "tick-circle",
    unstable: "danger",
    idealizing: "info-circle",
    "self-harming": "warning-2",
    "highly at risk": "shield-cross",
  };

  let search = $state("");
  let filtersOpen = $state(false);
  let filtersBox = $state<HTMLDivElement>();

  // Filters live in the URL, so /?tag=Genshin&identity=Transgender opens already filtered
  let tagFilter = $state(page.url.searchParams.get("tag"));
  let identityFilter = $state(page.url.searchParams.get("identity"));
  const activeFilters = $derived((tagFilter ? 1 : 0) + (identityFilter ? 1 : 0));

  const members = $derived(sortMembers(rawMembers));
  const frontingNow = $derived(fronters?.members ?? []);
  const mental = $derived(system?.mental_state ?? null);

  const tags = $derived([...new Set(members.flatMap((m) => m.tags ?? []))].sort((a, b) => a.localeCompare(b)));
  const identities = $derived(
    [...new Set(members.flatMap((m) => m.pride ?? []))].sort((a, b) => a.localeCompare(b)),
  );

  const shown = $derived.by(() => {
    const query = search.toLowerCase();
    return members.filter((member) => {
      if (query) {
        const named = memberName(member).toLowerCase().includes(query);
        const tagged = member.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!named && !tagged) return false;
      }
      if (tagFilter === "untagged" && member.tags?.length) return false;
      if (tagFilter && tagFilter !== "untagged" && !member.tags?.includes(tagFilter)) return false;
      if (identityFilter && !member.pride?.includes(identityFilter)) return false;
      return true;
    });
  });

  function isFronting(member: PluralMember): boolean {
    return frontingNow.some((m) => m.id === member.id || m.name === member.name);
  }

  // Keeps the address bar in step without navigating, so the page never scrolls
  function syncUrl() {
    const url = new URL(page.url.href);
    url.search = "";
    if (tagFilter) url.searchParams.set("tag", tagFilter);
    if (identityFilter) url.searchParams.set("identity", identityFilter);
    replaceState(url, {});
  }

  function applyFilter(kind: "tag" | "identity", value: string | null) {
    if (kind === "tag") tagFilter = value;
    else identityFilter = value;
    syncUrl();
  }

  function toggleTag(tag: string) {
    applyFilter("tag", tagFilter === tag ? null : tag);
  }

  function clearFilters() {
    tagFilter = null;
    identityFilter = null;
    syncUrl();
  }

  function sortedTags(member: PluralMember): string[] {
    return [...(member.tags ?? [])].sort((a, b) => a.localeCompare(b));
  }

  // Close the filters popover on an outside click or Escape
  function onWindowClick(event: MouseEvent) {
    if (filtersOpen && filtersBox && !filtersBox.contains(event.target as Node)) filtersOpen = false;
  }

  function onWindowKey(event: KeyboardEvent) {
    if (event.key === "Escape") filtersOpen = false;
  }
</script>

<svelte:window onmousedown={onWindowClick} onkeydown={onWindowKey} />

<svelte:head>
  <title>Doughmination System | Plural System Member Tracker & Fronting Manager</title>
  <meta
    name="description"
    content="Real-time plural system tracker for the Doughmination System. View current fronters, system members, and track switching patterns."
  />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{siteUrl}/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Doughmination System | Plural System Tracker" />
  <meta property="og:description" content="Real-time plural system tracker. View current fronters and members of the Doughmination System." />
  <meta property="og:url" content="{siteUrl}/" />
  <meta property="og:image" content={fallbackAvatar} />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<DiscordEmbed
  title="Doughmination System"
  description="Real-time plural system tracker. View current fronters and members of the Doughmination System."
/>

<div class="page">
  {#if live.status === "reconnecting"}
    <p class="notice error" role="status">Live updates disconnected. Reconnecting…</p>
  {/if}

  <div class="page-head">
    <p class="eyebrow">// system.members</p>
    <h1>System Members</h1>
  </div>

  {#if mental}
    <div class="mental mental-{mental.level.replaceAll(' ', '-')}">
      <iconsax-icon name={MENTAL_ICONS[mental.level] ?? "info-circle"} type="bulk" size="32"></iconsax-icon>
      <div>
        <p><span class="muted">status:</span> <span class="mental-label">[ {MENTAL_LABELS[mental.level] ?? mental.level} ]</span></p>
        {#if mental.notes}
          <p>{mental.notes}</p>
        {/if}
        <small class="muted">last_updated: {new Date(mental.updated_at).toLocaleString()}</small>
      </div>
    </div>
  {/if}

  {#if frontingNow.length > 0}
    <section class="panel">
      <h2>Currently {frontingNow.length > 1 ? "Co-fronting" : "Fronting"}</h2>
      <div class="fronting">
        {#each frontingNow as member, index (member.id || `${member.name}-${index}`)}
          <div class="fronter" style:--member-color={normalizeColor(member.color) ?? "var(--accent)"}>
            <a href="/{member.name}">
              <img
                class="member-avatar fronter-avatar"
                src={member.avatar_url || fallbackAvatar}
                alt={memberName(member)}
                loading="lazy"
                onerror={avatarFallback}
              />
            </a>
            <div class="fronter-body">
              <a class="member-name" href="/{member.name}" style:color={readableOnDark(member.color, "var(--accent)")}>
                {memberName(member) || "Unknown"}
              </a>
              {#if member.tags?.length}
                <div class="chips">
                  {#each sortedTags(member) as tag (tag)}
                    <button type="button" class="chip" class:active={tagFilter === tag} onclick={() => toggleTag(tag)}>
                      {tag}
                    </button>
                  {/each}
                </div>
              {/if}
              {#if member.status}
                <div class="status-tag">
                  {#if member.status.emoji}<span>{member.status.emoji}</span>{/if}
                  <span>{member.status.text}</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <div class="controls">
    <div class="filters" bind:this={filtersBox}>
      <button type="button" class:primary={filtersOpen} aria-expanded={filtersOpen} onclick={() => (filtersOpen = !filtersOpen)}>
        <iconsax-icon name="filter" type="bulk" size="16"></iconsax-icon>Filters
        {#if activeFilters > 0}<span class="badge accent">{activeFilters}</span>{/if}
      </button>

      {#if filtersOpen}
        <div class="filters-panel panel">
          <p class="field-label">Tag</p>
          <div class="chips">
            <button type="button" class="chip" class:active={tagFilter === null} onclick={() => applyFilter("tag", null)}>All</button>
            {#each tags as tag (tag)}
              <button type="button" class="chip" class:active={tagFilter === tag} onclick={() => toggleTag(tag)}>{tag}</button>
            {/each}
            <button type="button" class="chip" class:active={tagFilter === "untagged"} onclick={() => toggleTag("untagged")}>
              Untagged
            </button>
          </div>

          {#if identities.length > 0}
            <p class="field-label">Identity</p>
            <div class="chips">
              <button type="button" class="chip" class:active={identityFilter === null} onclick={() => applyFilter("identity", null)}>
                All
              </button>
              {#each identities as identity (identity)}
                <button
                  type="button"
                  class="chip"
                  class:active={identityFilter === identity}
                  onclick={() => applyFilter("identity", identityFilter === identity ? null : identity)}
                >
                  <PrideSwatch label={identity} />{identity}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    {#if tagFilter}
      <span class="chip active">
        tag: {tagFilter}
        <button type="button" class="chip-x" aria-label="Clear tag filter" onclick={() => applyFilter("tag", null)}>✕</button>
      </span>
    {/if}
    {#if identityFilter}
      <span class="chip active">
        identity: {identityFilter}
        <button type="button" class="chip-x" aria-label="Clear identity filter" onclick={() => applyFilter("identity", null)}>✕</button>
      </span>
    {/if}

    <label class="search">
      <iconsax-icon name="search-normal" type="bulk" size="18"></iconsax-icon>
      <input id="member-search" type="text" placeholder="Search members..." bind:value={search} />
      {#if search}
        <button type="button" class="chip-x" aria-label="Clear search" onclick={() => (search = "")}>✕</button>
      {/if}
    </label>
  </div>

  {#if shown.length > 0}
    <div class="grid">
      {#each shown as member (member.id)}
        <a
          class="member-card"
          class:fronting-now={isFronting(member)}
          href="/{member.name}"
          style:--member-color={normalizeColor(member.color) ?? "var(--accent)"}
        >
          <img class="member-avatar card-avatar" src={member.avatar_url || fallbackAvatar} alt={memberName(member)} loading="lazy" onerror={avatarFallback} />
          <h3 style:color={readableOnDark(member.color, "var(--text)")}>{memberName(member)}</h3>
          {#if member.pronouns}
            <p class="muted small">{member.pronouns}</p>
          {/if}
          {#if member.tags?.length}
            <div class="chips centred">
              {#each sortedTags(member).slice(0, 2) as tag (tag)}
                <!-- Inside the card's link, so a span acting as a button -->
                <span
                  role="button"
                  tabindex="0"
                  class="chip"
                  class:active={tagFilter === tag}
                  onclick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleTag(tag);
                  }}
                  onkeydown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    event.stopPropagation();
                    toggleTag(tag);
                  }}
                >
                  {tag}
                </span>
              {/each}
              {#if member.tags.length > 2}
                <span class="muted small">+{member.tags.length - 2}</span>
              {/if}
            </div>
          {/if}
          {#if member.status}
            <div class="status-tag">
              {#if member.status.emoji}<span>{member.status.emoji}</span>{/if}
              <span>{member.status.text}</span>
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {:else}
    <section class="panel empty">
      <p class="muted">
        {search || activeFilters > 0 ? "No members found matching your criteria." : "No members available."}
      </p>
      <div class="buttons">
        {#if search}
          <button type="button" class="small" onclick={() => (search = "")}>Clear search</button>
        {/if}
        {#if activeFilters > 0}
          <button type="button" class="small" onclick={clearFilters}>Clear filters</button>
        {/if}
      </div>
    </section>
  {/if}

  <!-- For search engines; hidden visually -->
  <section class="sr-only" aria-label="About Doughmination System">
    <h2>Doughmination System® - Real-Time Plural System Tracker</h2>
    <p>
      Welcome to the Doughmination System®, a plural system (DID/OSDD) management platform. Track current fronters,
      view all system members, and manage switching patterns in real-time.
    </p>
  </section>
</div>

<style>
  h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .fronting {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .fronter {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .fronter-avatar {
    width: 5.5rem;
    height: 5.5rem;
  }

  .fronter-body {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .member-name {
    font-size: 1.15rem;
    font-weight: 600;
    text-decoration: none;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
  }

  .filters {
    position: relative;
  }

  .filters-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 10;
    width: min(30rem, 90vw);
    background: #151319;
  }

  .field-label {
    margin: 0;
    color: var(--accent);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .chip-x {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font-size: 0.75rem;
  }

  .search {
    display: flex;
    flex: 1 1 16rem;
    gap: 0.5rem;
    align-items: center;
    padding: 0 0.75rem;
    border: 1px solid var(--line);
    border-radius: 0.75rem;
    background: rgb(0 0 0 / 25%);
    color: var(--muted);
  }

  .search input {
    padding-inline: 0;
    border: 0;
    background: none;
  }

  .search input:focus-visible {
    outline: none;
  }

  .search:focus-within {
    border-color: var(--accent-line);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 1rem;
  }

  .member-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    padding: 1.25rem 1rem;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--raised);
    text-align: center;
    text-decoration: none;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }

  .member-card:hover,
  .member-card:focus-visible {
    border-color: color-mix(in srgb, var(--member-color) 55%, transparent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--member-color) 15%, transparent);
    transform: translateY(-2px);
  }

  /* Fronting right now: the member's colour glows */
  .fronting-now {
    border-color: var(--member-color);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--member-color) 25%, transparent);
  }

  .card-avatar {
    width: 6rem;
    height: 6rem;
  }

  .member-card h3,
  .member-card p {
    margin: 0;
  }

  .member-card h3 {
    font-size: 1rem;
  }

  .centred {
    justify-content: center;
  }

  .member-card .status-tag {
    max-width: 10rem;
  }

  .empty {
    align-items: center;
    text-align: center;
  }

  .empty p {
    margin: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .member-card {
      transition: none;
    }

    .member-card:hover,
    .member-card:focus-visible {
      transform: none;
    }
  }
</style>
