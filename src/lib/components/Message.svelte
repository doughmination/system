<!-- src/lib/components/Message.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import type { Message } from "#lib";

  let { message }: { message: Message } = $props();
</script>

{#if message}
  <p class="notice" class:ok={message.type === "success"} class:error={message.type === "error"} role="status">
    {message.content}
  </p>
{/if}
