<!-- src/routes/owner/dash/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import IcPeople from "~icons/ic/outline-people";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
</script>

<svelte:head>
  <title>Owner dashboard · Doughmination System</title>
</svelte:head>

<Protected owner>
  <div class="page">
    <PageHead
      eyebrow="Owner"
      title="Owner dashboard"
      subtitle="System management hub"
      back={{
        href: "/",
        label: "Back to home",
      }}
    />

    <div class="tiles">
      <a class="tile" href="/owner/users">
        <span class="tile-icon"><IcPeople width="22" height="22" /></span>
        <h3>User management</h3>
        <p>Manage all users</p>
      </a>
    </div>
  </div>
</Protected>
