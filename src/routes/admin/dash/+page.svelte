<!-- src/routes/admin/dash/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import IcChat from "~icons/ic/outline-chat";
  import IcFavorite from "~icons/ic/outline-favorite";
  import IcFlag from "~icons/ic/outline-flag";
  import IcLabel from "~icons/ic/outline-label";
  import IcManageAccounts from "~icons/ic/outline-manage-accounts";
  import IcMonitorHeart from "~icons/ic/outline-monitor-heart";
  import IcRefresh from "~icons/ic/outline-refresh";
  import IcSwapHoriz from "~icons/ic/outline-swap-horiz";
  import { errorText, type Message as MessageType } from "#lib";
  import { client } from "#lib/api.ts";
  import { auth } from "#lib/auth.svelte.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  const PAGES = [
    {
      href: "/admin/members",
      owner: true,
      label: "Member manager",
      icon: IcManageAccounts,
      desc: "Create and edit members, import data",
    },
    {
      href: "/admin/switch",
      label: "Switch manager",
      icon: IcSwapHoriz,
      desc: "Manage fronting members",
    },
    {
      href: "/admin/mental",
      label: "Mental health",
      icon: IcMonitorHeart,
      desc: "Update mental state",
    },
    {
      href: "/admin/status",
      label: "Status manager",
      icon: IcChat,
      desc: "Set member statuses",
    },
    {
      href: "/admin/tags",
      owner: true,
      label: "Tag manager",
      icon: IcLabel,
      desc: "Manage member tags",
    },
    {
      href: "/admin/pride",
      owner: true,
      label: "Pride manager",
      icon: IcFlag,
      desc: "Set member pride identities",
    },
    {
      href: "/admin/relationships",
      owner: true,
      label: "Relationships",
      icon: IcFavorite,
      desc: "Map who is dating who",
    },
  ];

  // Owner-only pages are hidden from admins
  const visiblePages = $derived(PAGES.filter((page) => !page.owner || auth.isOwner));

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
          <IcRefresh width="16" height="16" />{refreshing ? "Sending..." : "Refresh all"}
        </button>
      </div>
    </section>

    <div class="tiles">
      {#each visiblePages as page (page.href)}
        <a class="tile" href={page.href}>
          <span class="tile-icon"><page.icon width="22" height="22" /></span>
          <h3>{page.label}</h3>
          <p>{page.desc}</p>
        </a>
      {/each}
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
