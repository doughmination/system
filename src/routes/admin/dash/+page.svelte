<!-- src/routes/admin/dash/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { errorText, type Message as MessageType } from "#lib";
  import { client } from "#lib/api.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  const PAGES = [
    {
      href: "/admin/switch",
      label: "Switch manager",
      icon: "refresh-circle",
      desc: "Manage fronting members",
    },
    {
      href: "/admin/mental",
      label: "Mental health",
      icon: "activity",
      desc: "Update mental state",
    },
    {
      href: "/admin/status",
      label: "Status manager",
      icon: "message-text",
      desc: "Set member statuses",
    },
    {
      href: "/admin/tags",
      label: "Tag manager",
      icon: "tag",
      desc: "Manage member tags",
    },
    {
      href: "/admin/pride",
      label: "Pride manager",
      icon: "flag",
      desc: "Set member pride identities",
    },
    {
      href: "/admin/relationships",
      label: "Relationships",
      icon: "lovely",
      desc: "Map who is dating who",
    },
  ];

  let refreshing = $state(false);
  let message = $state<MessageType>(null);

  async function forceRefresh() {
    if (!confirm("This will reload the website for ALL connected users. Are you sure?")) return;

    refreshing = true;
    message = null;
    try {
      await client.forceRefresh();
      message = {
        type: "success",
        content: "Refresh command sent to all connected clients! The page will reload in 3 seconds...",
      };
      setTimeout(() => location.reload(), 3000);
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, "Failed to send refresh command"),
      };
      refreshing = false;
    }
  }
</script>

<svelte:head>
  <title>Admin dashboard · Doughmination System</title>
</svelte:head>

<Protected admin>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Admin dashboard"
      subtitle="System management hub"
      back={{
        href: "/",
        label: "Back to home",
      }}
    />

    <Message {message} />

    <section class="panel danger-zone">
      <div class="grow">
        <h2>[ danger ] Force refresh all clients</h2>
        <p class="muted">
          Send a refresh command to all users currently viewing the website. This will immediately reload their browsers.
        </p>
      </div>
      <div>
        <button type="button" class="danger" disabled={refreshing} onclick={forceRefresh}>
          <iconsax-icon name="refresh-arrow-01" type="bulk" size="16"></iconsax-icon>{refreshing ? "Sending..." : "Refresh all"}
        </button>
      </div>
    </section>

    <div class="tiles">
      {#each PAGES as page (page.href)}
        <a class="tile" href={page.href}>
          <span class="tile-icon"><iconsax-icon name={page.icon} type="bulk" size="22"></iconsax-icon></span>
          <h3>{page.label}</h3>
          <p>{page.desc}</p>
        </a>
      {/each}
      <a class="tile" href="https://doughmination.uk/docs" target="_blank" rel="noopener noreferrer">
        <span class="tile-icon"><iconsax-icon name="driver" type="bulk" size="22"></iconsax-icon></span>
        <h3>API endpoints</h3>
        <p>View API reference</p>
      </a>
    </div>
  </div>
</Protected>

<style>
  .danger-zone {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    border-color: rgb(255 138 154 / 35%);
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: var(--bad);
    font-size: 1rem;
  }
</style>
