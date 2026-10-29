<!-- src/routes/fronting/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import Home from "#lib/components/Home.svelte";

  let { data } = $props();
</script>

<Home members={data.members} fronters={data.fronters} system={data.system} />
