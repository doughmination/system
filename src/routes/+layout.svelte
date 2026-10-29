<!-- src/routes/+layout.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import "#lib/styles/fonts.css";
  import "#lib/styles/theme.css";
  import "#lib/styles/global.css";
  import "#lib/styles/ui.css";
  import "#lib/styles/system.css";
  import { onMount } from "svelte";
  import { auth } from "#lib/auth.svelte.ts";
  import { live } from "#lib/live.svelte.ts";
  import Header from "#lib/components/Header.svelte";
  import Footer from "#lib/components/Footer.svelte";

  let { children } = $props();

  onMount(() => {
    void auth.load();
    live.connect();
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#eb459e" />
  <meta property="og:site_name" content="Doughmination System" />
  <meta property="og:locale" content="en_GB" />
  <meta name="twitter:site" content="@doughmination" />
</svelte:head>

<Header />
<main>
  {@render children()}
</main>
<Footer />
