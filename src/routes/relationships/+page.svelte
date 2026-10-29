<!-- src/routes/relationships/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import type { PluralMember } from "doughmination-api/server";
  import { fallbackAvatar, memberName } from "#lib";
  import { normalizeColor } from "#lib/colour.ts";
  import PageHead from "#lib/components/PageHead.svelte";

  let { data } = $props();

  const SIZE = 720;
  const CENTER = SIZE / 2;
  const RING_RADIUS = 280;
  const NODE_RADIUS = 34;

  const byId = $derived.by(() => {
    const lookup = new Map<string, PluralMember>();
    for (const member of data.members) {
      if (member.id) lookup.set(member.id, member);
      if (member.name) lookup.set(member.name, member);
    }
    return lookup;
  });

  // Everyone in a relationship, spaced evenly round a ring
  const nodes = $derived.by(() => {
    const involved = new Set(data.relationships.flatMap((edge) => edge.members));
    const resolved = [...involved].map((id) => byId.get(id)).filter((m): m is PluralMember => Boolean(m));
    const unique = [...new Map(resolved.map((m) => [m.id, m])).values()];

    return unique.map((member, index) => {
      const angle = (index / Math.max(unique.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        member,
        x: CENTER + RING_RADIUS * Math.cos(angle),
        y: CENTER + RING_RADIUS * Math.sin(angle),
      };
    });
  });

  function nodeFor(identifier: string) {
    return nodes.find((node) => node.member.id === identifier || node.member.name === identifier);
  }
</script>

<svelte:head>
  <title>Relationship Map · Doughmination System</title>
</svelte:head>

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

  {#if nodes.length === 0}
    <p class="panel muted">No relationships to show yet</p>
  {:else}
    <section class="panel map">
      <svg viewBox="0 0 {SIZE} {SIZE}" width="100%" role="img" aria-label="Relationship map">
        <defs>
          {#each nodes as node (node.member.id)}
            <clipPath id="clip-{node.member.id}">
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS} />
            </clipPath>
          {/each}
        </defs>

        {#each data.relationships as edge (edge.id)}
          {@const from = nodeFor(edge.members[0])}
          {@const to = nodeFor(edge.members[1])}
          {#if from && to}
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--accent)" stroke-width="2" stroke-opacity="0.55" />
            <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 4} text-anchor="middle" font-size="11" fill="var(--muted)">
              {edge.type}
            </text>
          {/if}
        {/each}

        {#each nodes as node (node.member.id)}
          <a href="/{node.member.name ?? node.member.id}">
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS + 2}
              fill="var(--bg)"
              stroke={normalizeColor(node.member.color) ?? "var(--accent)"}
              stroke-width="2"
            />
            <image
              href={node.member.avatar_url || fallbackAvatar}
              x={node.x - NODE_RADIUS}
              y={node.y - NODE_RADIUS}
              width={NODE_RADIUS * 2}
              height={NODE_RADIUS * 2}
              clip-path="url(#clip-{node.member.id})"
              preserveAspectRatio="xMidYMid slice"
            />
            <text x={node.x} y={node.y + NODE_RADIUS + 16} text-anchor="middle" font-size="13" fill="var(--text)">
              {memberName(node.member)}
            </text>
          </a>
        {/each}
      </svg>
    </section>
  {/if}
</div>

<style>
  .map svg {
    display: block;
    max-width: 720px;
    margin: 0 auto;
  }
</style>
