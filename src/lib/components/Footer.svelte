<!-- src/lib/components/Footer.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import IcFavorite from "~icons/ic/outline-favorite";
  import "#lib/styles/footer.css";
  import { SiGithub } from "simple-icons";
  import { fallbackAvatar, mainSite } from "#lib";
</script>

<footer>
  <p class="footer-line">
    <span class="footer-brand">
      <img src={fallbackAvatar} alt="" width="20" height="20" />
      Doughmination System®
    </span>

    <span>
      part of <a href={mainSite}>doughmination.gay</a>
      <IcFavorite width="16" height="16" class="beat" />
    </span>

    <span>
      <a href="https://github.com/doughmination/web/tree/main/system" target="_blank" rel="noopener noreferrer" class="with-icon">
        <SiGithub size={16} />View on GitHub
      </a>
    </span>
  </p>

  <p class="trademark">
    Doughmination System® is a trade mark in the United Kingdom under trademark number
    <a
      href="https://trademarks.ipo.gov.uk/ipo-tmcase/page/Results/1/UK00004263144"
      target="_blank"
      rel="noopener noreferrer">UK00004263144</a
    >
  </p>
</footer>

<style>
  .trademark {
    margin: 0;
    font-size: 0.75rem;
  }
</style>
