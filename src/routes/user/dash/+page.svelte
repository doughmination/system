<!-- src/routes/user/dash/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.2 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
</script>

<svelte:head>
  <title>Public dashboard · Doughmination System</title>
</svelte:head>

<Protected>
  <div class="page">
    <PageHead
      eyebrow="Public"
      title="Public dashboard"
      subtitle="For every signed-in user"
      back={{
        href: "/",
        label: "Back to home",
      }}
    />

    <div class="tiles">
      <a class="tile" href="/user/docs">
        <span class="tile-icon"><iconsax-icon name="driver" type="bulk" size="22"></iconsax-icon></span>
        <h3>API docs</h3>
        <p>Every endpoint on this site</p>
      </a>
      <a class="tile" href="/user/metrics">
        <span class="tile-icon"><iconsax-icon name="chart-2" type="bulk" size="22"></iconsax-icon></span>
        <h3>Metrics</h3>
        <p>Fronting and switching statistics</p>
      </a>
    </div>
  </div>
</Protected>
