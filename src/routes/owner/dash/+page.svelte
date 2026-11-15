<!-- src/routes/owner/dash/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import IcFavorite from "~icons/ic/outline-favorite";
  import IcFlag from "~icons/ic/outline-flag";
  import IcLabel from "~icons/ic/outline-label";
  import IcManageAccounts from "~icons/ic/outline-manage-accounts";
  import IcPeople from "~icons/ic/outline-people";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";

  const PAGES = [
    {
      href: "/owner/users",
      label: "User management",
      icon: IcPeople,
      desc: "Manage all users",
    },
    {
      href: "/admin/members",
      label: "Member manager",
      icon: IcManageAccounts,
      desc: "Create and edit members, import data",
    },
    {
      href: "/admin/tags",
      label: "Tag manager",
      icon: IcLabel,
      desc: "Manage member tags",
    },
    {
      href: "/admin/pride",
      label: "Pride manager",
      icon: IcFlag,
      desc: "Set member pride identities",
    },
    {
      href: "/admin/relationships",
      label: "Relationships",
      icon: IcFavorite,
      desc: "Map who is dating who",
    },
  ];
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
      {#each PAGES as page (page.href)}
        <a class="tile" href={page.href}>
          <span class="tile-icon"><page.icon width="22" height="22" /></span>
          <h3>{page.label}</h3>
          <p>{page.desc}</p>
        </a>
      {/each}
    </div>
  </div>
</Protected>
