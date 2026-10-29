<!-- src/routes/+error.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { page } from "$app/state";

  const notFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{notFound ? "Not found" : "Something went wrong"} · Doughmination System</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page narrow">
  <section class="panel">
    <p class="eyebrow">Error {page.status}</p>
    <h1>{notFound ? "Page not found" : (page.error?.title ?? "Something went wrong")}</h1>
    <p class="muted">{notFound ? "There's nothing at that address." : page.error?.message}</p>
    <p>
      <a class="btn" href="/"><iconsax-icon name="arrow-left-01" type="bulk" size="16"></iconsax-icon>Return to home</a>
    </p>
  </section>
</div>

<style>
  p {
    margin: 0;
  }
</style>
