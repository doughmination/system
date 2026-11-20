<!-- src/routes/admin/members/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.2 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import type { PluralMember, PluralProxyTag } from "#lib/types.ts";
  import { avatarFallback, errorText, fallbackAvatar, memberName, sortMembers, type Message as MessageType } from "#lib";
  import { authFetch, client } from "#lib/api.ts";
  import { auth } from "#lib/auth.svelte.ts";
  import Protected from "#lib/components/Protected.svelte";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  // Text fields, in form order. Empty input is saved as null
  const FIELDS = [
    {
      key: "name",
      label: "Name",
      placeholder: "Used in links and switching",
    },
    {
      key: "display_name",
      label: "Display name",
      placeholder: "Shown on the site",
    },
    {
      key: "pronouns",
      label: "Pronouns",
      placeholder: "fae/faer",
    },
    {
      key: "color",
      label: "Colour",
      placeholder: "ff99cc (no #)",
    },
    {
      key: "birthday",
      label: "Birthday",
      placeholder: "YYYY-MM-DD, year 0004 hides it",
    },
  ] as const;

  type FieldKey = (typeof FIELDS)[number]["key"];

  let members = $state<PluralMember[]>([]);
  let chosenId = $state<string | null>(null);
  let form = $state<Record<FieldKey | "description" | "proxy_tags", string>>(emptyForm());
  let loading = $state(true);
  let saving = $state(false);
  let message = $state<MessageType>(null);

  let avatarFile = $state<FileList | null>(null);
  let bannerFile = $state<FileList | null>(null);
  let localiseKept = $state<string[]>([]);

  const chosen = $derived(members.find((member) => member.id === chosenId) ?? null);

  function emptyForm() {
    return {
      name: "",
      display_name: "",
      pronouns: "",
      color: "",
      birthday: "",
      description: "",
      proxy_tags: "",
    };
  }

  // One tag per line, written like PluralKit: "c:text" or "[text]"
  function tagsToText(tags: PluralProxyTag[] | undefined): string {
    return (tags ?? []).map((tag) => `${tag.prefix ?? ""}text${tag.suffix ?? ""}`).join("\n");
  }

  function textToTags(text: string): PluralProxyTag[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes("text"))
      .map((line) => {
        const at = line.indexOf("text");
        return {
          prefix: line.slice(0, at) || null,
          suffix: line.slice(at + 4) || null,
        };
      });
  }

  function pick(member: PluralMember | null) {
    chosenId = member?.id ?? null;
    // Picked images belong to the member they were picked for
    avatarFile = new DataTransfer().files;
    bannerFile = new DataTransfer().files;
    message = null;
    if (!member) {
      form = emptyForm();
      return;
    }
    form = {
      name: member.original_name ?? member.name ?? "",
      display_name: member.is_special ? "" : (member.display_name ?? ""),
      pronouns: member.pronouns ?? "",
      color: member.color ?? "",
      birthday: member.birthday ?? "",
      description: member.description ?? "",
      proxy_tags: tagsToText(member.proxy_tags),
    };
  }

  function body() {
    const result: Record<string, unknown> = {
      description: form.description.trim() || null,
      proxy_tags: textToTags(form.proxy_tags),
    };
    for (const field of FIELDS) result[field.key] = form[field.key].trim() || null;
    return result;
  }

  async function reload() {
    members = sortMembers(await client.getMembers());
  }

  onMount(() => {
    void reload()
      .catch((err) => {
        message = {
          type: "error",
          content: errorText(err, "Failed to load members"),
        };
      })
      .finally(() => (loading = false));
  });

  async function run(action: () => Promise<string>, fallback: string) {
    saving = true;
    message = null;
    try {
      message = {
        type: "success",
        content: await action(),
      };
    } catch (err) {
      message = {
        type: "error",
        content: errorText(err, fallback),
      };
    } finally {
      saving = false;
    }
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    // Read before pick() below clears them
    const creating = !chosenId;
    const uploads = [
      {
        path: "avatar",
        file: avatarFile?.[0],
      },
      {
        path: "banner",
        file: bannerFile?.[0],
      },
    ];

    void run(async () => {
      const path = chosenId ? `/plural/members/${encodeURIComponent(chosenId)}` : "/plural/members";
      const saved = await authFetch<PluralMember>(path, {
        method: chosenId ? "PATCH" : "POST",
        body: JSON.stringify(body()),
      }, "Failed to save member");

      // Select the saved member first, so a failed upload can't lead to creating them twice
      await reload();
      pick(members.find((member) => member.id === saved.id) ?? null);

      // Picked images waited in the form until the member existed
      const picked = uploads.filter((upload) => upload.file);
      for (const { path, file } of picked) {
        await authFetch(`/plural/members/${encodeURIComponent(saved.id)}/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": file!.type,
          },
          body: file,
        }, `Member saved, but the ${path} upload failed`);
      }
      if (picked.length > 0) {
        await reload();
        pick(members.find((member) => member.id === saved.id) ?? null);
      }

      return creating ? "Member created!" : "Member saved!";
    }, "Failed to save member");
  }

  // One-off: moves outside image links onto this site
  function localise() {
    if (!confirm("Copy every member and system image onto this site? Links that fail (4xx or 5xx) get removed.")) return;

    void run(async () => {
      const report = await authFetch<{
        copied: string[];
        removed: string[];
        kept: string[];
      }>("/plural/admin/media/localise", { method: "POST" }, "Moving images failed");
      await reload();
      localiseKept = report.kept;
      return `Copied ${report.copied.length}, removed ${report.removed.length}, kept ${report.kept.length} as they were`;
    }, "Moving images failed");
  }

  function remove() {
    if (!chosen || !confirm(`Delete ${memberName(chosen)}? Their past switches stay in the history.`)) return;

    void run(async () => {
      await authFetch(`/plural/members/${encodeURIComponent(chosen.id)}`, { method: "DELETE" }, "Failed to delete member");
      pick(null);
      await reload();
      return "Member deleted";
    }, "Failed to delete member");
  }
</script>

<svelte:head>
  <title>Member manager · Doughmination System</title>
</svelte:head>

<Protected owner>
  <div class="page">
    <PageHead
      eyebrow="Admin"
      title="Member manager"
      subtitle="Create, edit and remove members"
      back={{
        href: "/admin/dash",
        label: "Back to dashboard",
      }}
    />

    <Message {message} />

    {#if loading}
      <p class="muted">Loading…</p>
    {:else}
      <div class="two-col">
        <form class="panel stack" onsubmit={save}>
          <h2>{chosen ? `Editing ${memberName(chosen)}` : "New member"}</h2>

          {#each FIELDS as field (field.key)}
            <label class="field">
              <span>{field.label}</span>
              <input type="text" bind:value={form[field.key]} placeholder={field.placeholder} required={field.key === "name"} />
            </label>
          {/each}

          {#if auth.isOwner}
            <label class="field">
              <span>Avatar</span>
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" bind:files={avatarFile} />
              <small class="muted">
                {chosen ? "Uploads when you save. Replaces the current avatar and the proxy avatar" : "Uploads when you create the member"}. PNG, JPEG, GIF or WebP, up to 10 MB
              </small>
            </label>

            <label class="field">
              <span>Banner</span>
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" bind:files={bannerFile} />
              <small class="muted">
                {chosen ? "Uploads when you save. Replaces the current banner" : "Uploads when you create the member"}. Same formats, up to 10 MB
              </small>
            </label>
          {/if}

          <label class="field">
            <span>Description</span>
            <textarea bind:value={form.description} maxlength="1000" rows="4"></textarea>
          </label>

          <label class="field">
            <span>Proxy tags</span>
            <textarea bind:value={form.proxy_tags} rows="2" placeholder={"c:text\n[text]"}></textarea>
            <small class="muted">One per line. "text" marks where the message goes</small>
          </label>

          <div class="buttons">
            <button type="submit" class="primary" disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : chosen ? "Save member" : "Create member"}
            </button>
            {#if chosen}
              <button type="button" disabled={saving} onclick={() => pick(null)}>New member</button>
              {#if auth.isOwner}
                <button type="button" class="danger" disabled={saving} onclick={remove}>Delete</button>
              {/if}
            {/if}
          </div>
        </form>

        <section class="panel">
          <h2>Members</h2>
          <p class="muted small">{members.length} member(s)</p>
          <div class="pick-list">
            {#each members as member (member.id)}
              <button type="button" class="pick" class:selected={member.id === chosenId} onclick={() => pick(member)}>
                <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
                <span class="grow">
                  <p>{memberName(member)}</p>
                  <p class="muted small">{member.id}{member.pronouns ? ` · ${member.pronouns}` : ""}</p>
                </span>
              </button>
            {:else}
              <p class="muted">No members yet. Create one with the form.</p>
            {/each}
          </div>
        </section>
      </div>

      {#if auth.isOwner}
        <section class="panel stack localise">
          <h2>Move images to this site</h2>
          <p class="muted small">Copies every avatar and banner that still lives elsewhere into this site's storage. Links that fail with 4xx or 5xx are removed.</p>
          <div class="buttons">
            <button type="button" disabled={saving} onclick={localise}>Move images</button>
          </div>
          {#if localiseKept.length > 0}
            <p class="small">Kept as they were, try again later:</p>
            <ul class="small">
              {#each localiseKept as line (line)}
                <li>{line}</li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}

    {/if}
  </div>
</Protected>

<style>
  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.05rem;
  }

  .localise {
    margin-top: 1.25rem;
  }

</style>
