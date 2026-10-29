<!-- src/lib/components/MemberSelect.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import type { PluralMember } from "doughmination-api/server";
  import { memberName } from "#lib";

  // A native picker keyed by member name, the identifier the admin endpoints take
  let {
    id,
    label,
    members,
    value = $bindable(""),
    by = "name",
    note,
  }: {
    id: string;
    label: string;
    members: PluralMember[];
    value?: string;
    by?: "name" | "id";
    note?: (member: PluralMember) => string;
  } = $props();
</script>

<label class="field" for={id}>
  <span>{label}</span>
  <select {id} bind:value>
    <option value="">Choose a member...</option>
    {#each members as member (member.id)}
      <option value={by === "id" ? member.id : (member.name ?? "")}>
        {memberName(member)}{note ? note(member) : ""}
      </option>
    {/each}
  </select>
</label>
