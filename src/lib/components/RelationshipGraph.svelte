<!-- src/lib/components/RelationshipGraph.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { PluralMember, Relationship } from "doughmination-api/server";
  import { fallbackAvatar, memberName } from "#lib";
  import { normalizeColor } from "#lib/colour.ts";
  import { layout, project } from "#lib/graph.ts";

  let {
    members,
    relationships,
  }: {
    members: PluralMember[];
    relationships: Relationship[];
  } = $props();

  const SIZE = 720;
  const CENTER = SIZE / 2;
  const RADIUS = 285;
  const NODE_RADIUS = 26;
  const SPIN_PER_FRAME = 0.0025;
  const DRAG_SPEED = 0.008;

  // Everyone in a relationship, once each, plus the links between them by index
  const graph = $derived.by(() => {
    const find = (identifier: string) =>
      members.find((member) => member.id === identifier || member.name === identifier);

    const nodes: PluralMember[] = [];
    const indexOf = (identifier: string): number | null => {
      const member = find(identifier);
      if (!member) return null;
      let index = nodes.findIndex((node) => node.id === member.id);
      if (index === -1) index = nodes.push(member) - 1;
      return index;
    };

    // Two crushes on each other fold into one mutual line, arrowed both ends
    const links: { edge: Relationship; a: number; b: number; mutual: boolean }[] = [];
    for (const edge of relationships) {
      const a = indexOf(edge.members[0]);
      const b = indexOf(edge.members[1]);
      if (a === null || b === null || a === b) continue;
      const reverse =
        edge.type === "crush" &&
        links.find((link) => link.edge.type === "crush" && link.a === b && link.b === a);
      if (reverse) reverse.mutual = true;
      else links.push({ edge, a, b, mutual: false });
    }

    return {
      nodes,
      links,
      points: layout(
        nodes.length,
        links.map((link) => [link.a, link.b] as [number, number]),
        RADIUS,
      ),
    };
  });

  // A slight tilt from the start, so it reads as 3D before anything moves
  let yaw = $state(0.6);
  let pitch = $state(-0.35);
  let hovered = $state<number | null>(null);
  let dragging = $state(false);
  let reduceMotion = $state(false);

  const projected = $derived(graph.points.map((point) => project(point, yaw, pitch, RADIUS)));

  // Painted back to front, so nearer things cover further ones
  const nodeOrder = $derived(
    graph.nodes.map((_, index) => index).sort((a, b) => projected[a]!.depth - projected[b]!.depth),
  );
  const linkOrder = $derived(
    [...graph.links].sort(
      (one, two) =>
        projected[one.a]!.depth + projected[one.b]!.depth - (projected[two.a]!.depth + projected[two.b]!.depth),
    ),
  );

  function linked(index: number): boolean {
    if (hovered === null) return true;
    if (index === hovered) return true;
    return graph.links.some(
      (link) => (link.a === hovered && link.b === index) || (link.b === hovered && link.a === index),
    );
  }

  function screen(index: number) {
    const point = projected[index]!;
    return {
      x: CENTER + point.x,
      y: CENTER + point.y,
      r: NODE_RADIUS * point.scale,
      // Further away is dimmer, but never invisible
      fade: 0.45 + 0.55 * Math.min(1, Math.max(0, point.depth)),
    };
  }

  // Drag to spin. A drag that moved isn't a click, so it doesn't open a member
  let last: { x: number; y: number } | null = null;
  let moved = 0;

  function pointerDown(event: PointerEvent) {
    last = {
      x: event.clientX,
      y: event.clientY,
    };
    moved = 0;
    dragging = true;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent) {
    if (!last) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw += dx * DRAG_SPEED;
    pitch = Math.max(-1.3, Math.min(1.3, pitch - dy * DRAG_SPEED));
    last = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function pointerUp() {
    last = null;
    dragging = false;
  }

  function swallowDragClick(event: MouseEvent) {
    if (moved > 4) event.preventDefault();
  }

  // Arrow keys spin it too
  function keydown(event: KeyboardEvent) {
    const step = 0.15;
    if (event.key === "ArrowLeft") yaw -= step;
    else if (event.key === "ArrowRight") yaw += step;
    else if (event.key === "ArrowUp") pitch = Math.max(-1.3, pitch - step);
    else if (event.key === "ArrowDown") pitch = Math.min(1.3, pitch + step);
    else return;
    event.preventDefault();
  }

  // A slow turn while nobody is interacting
  onMount(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion = motion.matches;

    let frame = 0;
    const tick = () => {
      if (!reduceMotion && !dragging && hovered === null) yaw += SPIN_PER_FRAME;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });
</script>

<!-- Interactive: drag and the arrow keys turn it -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<svg
  viewBox="0 0 {SIZE} {SIZE}"
  class="graph"
  class:dragging
  role="application"
  aria-roledescription="rotatable map"
  aria-label="Relationship map. Drag or use the arrow keys to turn it."
  tabindex="0"
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerUp}
  onpointercancel={pointerUp}
  onkeydown={keydown}
>
  <defs>
    <radialGradient id="graph-glow">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.12" />
      <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
    </radialGradient>
    <!-- Crushes are one way, so their lines end in an arrow -->
    <marker id="crush-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="var(--warn)" />
    </marker>
    {#each graph.nodes as node, index (node.id)}
      {@const at = screen(index)}
      <clipPath id="avatar-{node.id}">
        <circle cx={at.x} cy={at.y} r={at.r} />
      </clipPath>
    {/each}
  </defs>

  <!-- A soft floor of light, so the cluster has something to sit in -->
  <ellipse cx={CENTER} cy={CENTER} rx={RADIUS + 60} ry={RADIUS + 60} fill="url(#graph-glow)" />

  {#each linkOrder as link (link.edge.id)}
    {@const from = screen(link.a)}
    {@const to = screen(link.b)}
    {@const lit = hovered !== null && (link.a === hovered || link.b === hovered)}
    {@const crush = link.edge.type === "crush"}
    <!-- Stop a crush short of the avatar, so its arrow isn't hidden under it -->
    {@const length = Math.max(Math.hypot(to.x - from.x, to.y - from.y), 1)}
    {@const gapEnd = crush ? (to.r + 5) / length : 0}
    {@const gapStart = link.mutual ? (from.r + 5) / length : 0}
    <line
      x1={from.x + (to.x - from.x) * gapStart}
      y1={from.y + (to.y - from.y) * gapStart}
      x2={to.x - (to.x - from.x) * gapEnd}
      y2={to.y - (to.y - from.y) * gapEnd}
      marker-start={link.mutual ? "url(#crush-arrow)" : undefined}
      marker-end={crush ? "url(#crush-arrow)" : undefined}
      class="link"
      class:crush
      class:lit
      class:dim={hovered !== null && !lit}
      stroke-opacity={(from.fade + to.fade) / 2}
    >
      <title>
        {link.mutual
          ? `${memberName(graph.nodes[link.a]!)} & ${memberName(graph.nodes[link.b]!)}: mutual crush`
          : crush
          ? `${memberName(graph.nodes[link.a]!)} has a crush on ${memberName(graph.nodes[link.b]!)}`
          : `${memberName(graph.nodes[link.a]!)} & ${memberName(graph.nodes[link.b]!)}: ${link.edge.type}`}
      </title>
    </line>
  {/each}

  {#each nodeOrder as index (graph.nodes[index]!.id)}
    {@const node = graph.nodes[index]!}
    {@const at = screen(index)}
    <a
      href="/{node.name ?? node.id}"
      class="node"
      class:dim={!linked(index)}
      onclick={swallowDragClick}
      onpointerenter={() => (hovered = index)}
      onpointerleave={() => (hovered = null)}
      onfocus={() => (hovered = index)}
      onblur={() => (hovered = null)}
    >
      <g opacity={at.fade}>
      <circle cx={at.x} cy={at.y} r={at.r + 3} fill="var(--bg)" stroke={normalizeColor(node.color) ?? "var(--accent)"} stroke-width="2.5" />
      <image
        href={node.avatar_url || fallbackAvatar}
        x={at.x - at.r}
        y={at.y - at.r}
        width={at.r * 2}
        height={at.r * 2}
        clip-path="url(#avatar-{node.id})"
        preserveAspectRatio="xMidYMid slice"
      />
      <text x={at.x} y={at.y + at.r + 16} text-anchor="middle" font-size={12 * projected[index]!.scale + 1}>
        {memberName(node)}
      </text>
      </g>
    </a>
  {/each}
</svg>

<p class="legend muted small">
  <span><svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" class="link" /></svg> partner</span>
  <span><svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" class="link crush" /></svg> crush (one way)</span>
  <span>Drag to turn · hover someone to see their links</span>
</p>

<style>
  .graph {
    display: block;
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .graph:focus-visible {
    border-radius: 1rem;
    outline: 2px solid var(--accent);
  }

  .dragging {
    cursor: grabbing;
  }

  .link {
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linecap: round;
    transition: stroke-width 0.15s ease;
  }

  .crush {
    stroke: var(--warn);
    stroke-dasharray: 5 6;
  }

  .lit {
    stroke-width: 3.5;
  }

  .dim {
    opacity: 0.15;
  }

  .link.dim {
    stroke-opacity: 0.12;
  }

  .node text {
    fill: var(--text);
    paint-order: stroke;
    stroke: var(--bg);
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .node:focus-visible {
    outline: none;
  }

  .node:focus-visible circle {
    stroke: var(--text);
    stroke-width: 4;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    justify-content: center;
    margin: 0;
  }

  .legend span {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .link {
      transition: none;
    }
  }
</style>
