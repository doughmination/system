<!-- src/lib/components/PageHead.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  let {
    eyebrow,
    title,
    subtitle = "",
    back,
  }: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    back?: {
      href: string;
      label: string;
    };
  } = $props();
</script>

<div class="head">
  <div class="page-head">
    <p class="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    {#if subtitle}
      <p class="muted">{subtitle}</p>
    {/if}
  </div>
  {#if back}
    <a class="btn" href={back.href}>
      <iconsax-icon name="arrow-left-01" type="bulk" size="16"></iconsax-icon>{back.label}
    </a>
  {/if}
</div>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    justify-content: space-between;
  }
</style>
