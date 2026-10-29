<!-- src/routes/[member_id]/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { avatarFallback, fallbackAvatar, memberName, siteName, siteUrl } from "#lib";
  import { normalizeColor, readableOnDark } from "#lib/colour.ts";
  import PrideSwatch from "#lib/components/PrideSwatch.svelte";

  let { data } = $props();

  const member = $derived(data.member);
  const name = $derived(memberName(member));
  const colour = $derived(normalizeColor(member.color));
  const nameColour = $derived(readableOnDark(member.color, "var(--text)"));
  const avatar = $derived(member.avatar_url || fallbackAvatar);
  const pageUrl = $derived(`${siteUrl}/${encodeURIComponent(data.id)}`);

  const description = $derived.by(() => {
    if (member.description) return member.description;
    const parts: string[] = [];
    if (member.pronouns) parts.push(member.pronouns);
    if (member.tags?.length) parts.push(member.tags.join(", "));
    if (member.pride?.length) parts.push(member.pride.join(", "));
    return parts.length ? `${parts.join(" · ")} — member of the ${siteName}.` : `A member of the ${siteName}.`;
  });
</script>

<svelte:head>
  <title>{name} · {siteName}</title>
  <meta name="description" content={description} />
  <meta name="theme-color" content={colour ?? "#0a0b10"} />
  <link rel="canonical" href={pageUrl} />
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="{name} · {siteName}" />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:image" content={avatar} />
  <meta property="og:image:alt" content={name} />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<div class="page narrow">
  <article class="panel member" style:--member-color={colour ?? "var(--accent)"}>
    <img class="member-avatar big" src={avatar} alt={name} onerror={avatarFallback} />
    <h1 style:color={nameColour}>{name}</h1>
    {#if member.pronouns}
      <p class="muted">{member.pronouns}</p>
    {/if}
    {#if member.status}
      <div class="status-tag">
        {#if member.status.emoji}<span>{member.status.emoji}</span>{/if}
        <span>{member.status.text}</span>
      </div>
    {/if}

    {#if member.description}
      <section>
        <h2 style:color={nameColour}>About</h2>
        <p class="about">{member.description}</p>
      </section>
    {/if}

    {#if member.tags?.length}
      <section>
        <h2 style:color={nameColour}>Tags</h2>
        <div class="chips">
          {#each member.tags as tag (tag)}
            <a class="chip tinted" href="/?tag={encodeURIComponent(tag)}">{tag}</a>
          {/each}
        </div>
      </section>
    {/if}

    {#if member.pride?.length}
      <section>
        <h2 style:color={nameColour}>Pride</h2>
        <div class="chips">
          {#each member.pride as identity (identity)}
            <a class="chip" href="/?identity={encodeURIComponent(identity)}"><PrideSwatch label={identity} />{identity}</a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.partners.length}
      <section>
        <h2 style:color={nameColour}>Partners</h2>
        <div class="chips">
          {#each data.partners as partner (partner.id)}
            <a class="chip partner" href="/{partner.name ?? partner.id}">
              <img src={partner.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
              {memberName(partner)}
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <div>
      <a class="btn" href="/"><iconsax-icon name="arrow-left-01" type="bulk" size="16"></iconsax-icon>Back to members</a>
    </div>
  </article>
</div>

<style>
  .member {
    align-items: center;
    text-align: center;
  }

  .big {
    width: 9rem;
    height: 9rem;
  }

  h1 {
    margin: 0;
  }

  .member > p {
    margin: 0;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line);
  }

  h2 {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .about {
    margin: 0;
    white-space: pre-line;
  }

  .chips {
    justify-content: center;
  }

  .tinted {
    border-color: color-mix(in srgb, var(--member-color) 60%, transparent);
    background: color-mix(in srgb, var(--member-color) 12%, transparent);
    color: var(--text);
  }

  .partner img {
    width: 1.25rem;
    height: 1.25rem;
    object-fit: cover;
    border-radius: 0.3rem;
  }
</style>
