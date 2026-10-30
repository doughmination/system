<!-- src/lib/components/DiscordEmbed.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { page } from "$app/state";
  import { fallbackAvatar, mainSite, siteName, siteUrl } from "#lib";
  import { normalizeColor } from "#lib/colour.ts";

  let {
    title,
    description,
    image = fallbackAvatar,
    colour = null,
  }: {
    title: string;
    description: string;
    image?: string;
    colour?: string | null;
  } = $props();

  // Matches --accent in theme.css
  const accentColour = 0xeb459e;

  // Discord wants an integer; fall back to the accent for unset or non-hex colours
  const embedColour = $derived.by(() => {
    const hex = normalizeColor(colour)?.slice(1) ?? "";
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    return /^[0-9a-fA-F]{6}$/.test(full) ? parseInt(full, 16) : accentColour;
  });

  // Keeps the whole embed well under Discord's 3,000 byte cap
  const maxDescription = 1000;

  const pageUrl = $derived(siteUrl + page.url.pathname);

  const shortDescription = $derived(
    description.length > maxDescription
      ? description.slice(0, maxDescription - 1) + "…"
      : description,
  );

  // Discord component embed: one Container, Open Graph tags are the fallback
  const componentEmbed = $derived({
    component: {
      type: 17,
      accent_color: embedColour,
      components: [
        {
          type: 9,
          components: [
            {
              type: 10,
              content: `## ${title}`,
            },
            {
              type: 10,
              content: shortDescription,
            },
          ],
          accessory: {
            type: 11,
            media: { url: image },
          },
        },
        { type: 14 },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "Open page",
              url: pageUrl,
            },
            {
              type: 2,
              style: 5,
              label: "doughmination.gay",
              url: mainSite + "/",
            },
          ],
        },
        {
          type: 10,
          content: `-# ${siteName}`,
        },
      ],
    },
  });

  // Escape '<' so the JSON can't close the script tag early
  const toJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

  // Split closing tag so it doesn't end this script block
  const closingTag = "</" + "script>";
  const embedTag = $derived(
    `<script id='discord:component-embed' type='application/json'>${toJson(componentEmbed)}${closingTag}`,
  );
</script>

<svelte:head>
  <!-- Built from page props, '<' escaped -->
  {@html embedTag}
</svelte:head>
