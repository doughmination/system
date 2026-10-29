<!-- src/lib/components/PrideSwatch.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { findPrideFlag, prideSwatchGradient } from "#lib/pride.ts";

  let { label }: { label: string } = $props();

  const flag = $derived(findPrideFlag(label));
  const background = $derived(flag ? prideSwatchGradient(flag.stripes) : "var(--accent)");
</script>

<span class="swatch" style:background aria-hidden="true"></span>

<style>
  .swatch {
    display: inline-block;
    flex-shrink: 0;
    width: 0.85rem;
    height: 0.85rem;
    border: 1px solid rgb(0 0 0 / 35%);
    border-radius: 0.25rem;
    vertical-align: -0.1em;
  }
</style>
