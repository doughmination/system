<!-- src/routes/relationships/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { avatarFallback, fallbackAvatar, memberName } from "#lib";
  import PageHead from "#lib/components/PageHead.svelte";
  import RelationshipGraph from "#lib/components/RelationshipGraph.svelte";
  import DiscordEmbed from "#lib/components/DiscordEmbed.svelte";

  let { data } = $props();

  function find(identifier: string) {
    return data.members.find((member) => member.id === identifier || member.name === identifier);
  }

  // The same links as the map, as a plain list
  const pairs = $derived(
    data.relationships.flatMap((edge) => {
      const a = find(edge.members[0]);
      const b = find(edge.members[1]);
      return a && b ? [{ edge, a, b }] : [];
    }),
  );
</script>

<svelte:head>
  <title>Relationship Map · Doughmination System</title>
</svelte:head>

<DiscordEmbed
  title="Relationship Map"
  description="Who is dating who across the system."
/>

<div class="page">
  <PageHead
    eyebrow="// system.relationships"
    title="Relationship Map"
    subtitle="Who is dating who across the system"
    back={{
      href: "/",
      label: "Back to home",
    }}
  />

  {#if pairs.length === 0}
    <p class="panel muted">No relationships to show yet</p>
  {:else}
    <section class="panel">
      <RelationshipGraph members={data.members} relationships={data.relationships} />
    </section>

    <section class="panel">
      <h2>Everyone, in pairs</h2>
      <ul class="pairs">
        {#each pairs as pair (pair.edge.id)}
          <li>
            <a class="who" href="/{pair.a.name ?? pair.a.id}">
              <img class="member-avatar avatar-sm" src={pair.a.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />{memberName(pair.a)}
            </a>
            <span class="badge" class:accent={pair.edge.type !== "crush"}>{pair.edge.type}</span>
            <a class="who" href="/{pair.b.name ?? pair.b.id}">
              <img class="member-avatar avatar-sm" src={pair.b.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />{memberName(pair.b)}
            </a>
            {#if pair.edge.since}<span class="muted small">since {pair.edge.since}</span>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .pairs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
    gap: 0.6rem 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pairs li {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .who {
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    text-decoration: none;
  }

  .who:hover {
    color: var(--accent);
  }

  .avatar-sm {
    width: 1.75rem;
    height: 1.75rem;
  }
</style>
