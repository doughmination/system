<!-- src/routes/user/metrics/+page.svelte
     Copyright (c) 2026 Clove Nytrix Doughmination Twilight
     Licensed under the DASL-1.0 Licence.
     See LICENCE.md in the project root for full licence information.
-->

<script lang="ts">
  import { onMount } from "svelte";
  import { avatarFallback, fallbackAvatar, type Message as MessageType } from "#lib";
  import { client, readToken } from "#lib/api.ts";
  import PageHead from "#lib/components/PageHead.svelte";
  import Message from "#lib/components/Message.svelte";

  type Timeframe = "24h" | "48h" | "5d" | "7d" | "30d";

  type MemberMetric = {
    id: string;
    name: string;
    display_name: string;
    avatar_url?: string;
    total_seconds: number;
    total_percent: number;
  } & Record<Timeframe, number>;

  type FrontingMetrics = {
    total_time: number;
    members: Record<string, MemberMetric>;
  };

  type SwitchMetrics = {
    total_switches: number;
    avg_switches_per_day: number;
    timeframes: Record<Timeframe, number>;
  };

  const COLORS = [
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
  ];

  const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    {
      value: "24h",
      label: "Last 24 Hours",
    },
    {
      value: "48h",
      label: "Last 48 Hours",
    },
    {
      value: "5d",
      label: "Last 5 Days",
    },
    {
      value: "7d",
      label: "Last 7 Days",
    },
    {
      value: "30d",
      label: "Last 30 Days",
    },
  ];

  let fronting = $state<FrontingMetrics | null>(null);
  let switches = $state<SwitchMetrics | null>(null);
  let timeframe = $state<Timeframe>("7d");
  let loading = $state(true);
  let message = $state<MessageType>(null);

  const timeframeLabel = $derived(TIMEFRAMES.find((t) => t.value === timeframe)?.label ?? "");

  // The ten members who fronted most in the chosen window
  const top = $derived(
    fronting
      ? Object.values(fronting.members)
          .filter((m) => m[timeframe] > 0)
          .sort((a, b) => b[timeframe] - a[timeframe])
          .slice(0, 10)
      : [],
  );
  const topTotal = $derived(top.reduce((sum, m) => sum + m[timeframe], 0));

  // Donut slices as stroke-dasharray arcs on one circle
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const slices = $derived.by(() => {
    let offset = 0;
    return top.map((member, index) => {
      const length = topTotal ? (member[timeframe] / topTotal) * CIRCUMFERENCE : 0;
      const slice = {
        member,
        colour: COLORS[index % COLORS.length],
        dash: `${length} ${CIRCUMFERENCE - length}`,
        offset: -offset,
        percent: topTotal ? (member[timeframe] / topTotal) * 100 : 0,
      };
      offset += length;
      return slice;
    });
  });

  const switchMax = $derived(switches ? Math.max(1, ...Object.values(switches.timeframes)) : 1);

  function duration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  }

  onMount(async () => {
    const token = readToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [frontingRes, switchRes] = await Promise.all([
        fetch(`${client.baseUrl}/plural/metrics/fronting-time?days=30`, { headers }),
        fetch(`${client.baseUrl}/plural/metrics/switch-frequency?days=30`, { headers }),
      ]);
      if (frontingRes.ok && switchRes.ok) {
        fronting = await frontingRes.json();
        switches = await switchRes.json();
      } else {
        message = {
          type: "error",
          content:
            frontingRes.status === 401 || switchRes.status === 401
              ? "Metrics are not available publicly yet"
              : "Failed to fetch metrics",
        };
      }
    } catch {
      message = {
        type: "error",
        content: "Network error occurred",
      };
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Metrics · Doughmination System</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="// system.metrics"
    title="Metrics"
    subtitle="System fronting and switching statistics"
    back={{
      href: "/",
      label: "Back to home",
    }}
  />

  <Message {message} />

  {#if loading}
    <p class="muted">Loading metrics…</p>
  {:else}
    <label class="field timeframe">
      <span>Timeframe</span>
      <select bind:value={timeframe}>
        {#each TIMEFRAMES as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>

    {#if switches}
      <div class="tiles">
        <div class="panel stat">
          <p class="eyebrow">Total switches</p>
          <p class="value">{switches.total_switches}</p>
          <p class="muted small">Last 30 days</p>
        </div>
        <div class="panel stat">
          <p class="eyebrow">Avg per day</p>
          <p class="value">{switches.avg_switches_per_day.toFixed(1)}</p>
          <p class="muted small">Switches per day</p>
        </div>
        <div class="panel stat">
          <p class="eyebrow">Selected period</p>
          <p class="value">{switches.timeframes[timeframe]}</p>
          <p class="muted small">{timeframeLabel}</p>
        </div>
      </div>
    {/if}

    {#if fronting && top.length > 0}
      <section class="panel">
        <h2>Fronting time distribution</h2>
        <p class="muted small">Top fronters for {timeframeLabel.toLowerCase()}</p>
        <div class="donut-row">
          <svg viewBox="0 0 200 200" class="donut" role="img" aria-label="Fronting time by member">
            <g transform="rotate(-90 100 100)">
              {#each slices as slice (slice.member.id)}
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.colour}
                  stroke-width="28"
                  stroke-dasharray={slice.dash}
                  stroke-dashoffset={slice.offset}
                >
                  <title>{slice.member.display_name || slice.member.name}: {duration(slice.member[timeframe])}</title>
                </circle>
              {/each}
            </g>
          </svg>
          <ul class="legend">
            {#each slices as slice (slice.member.id)}
              <li>
                <span class="key" style:background={slice.colour}></span>
                {slice.member.display_name || slice.member.name}
                <span class="muted">{slice.percent.toFixed(0)}%</span>
              </li>
            {/each}
          </ul>
        </div>
      </section>
    {/if}

    {#if switches}
      <section class="panel">
        <h2>Switch frequency over time</h2>
        <p class="muted small">Number of switches across different timeframes</p>
        <div class="bars">
          {#each TIMEFRAMES as option (option.value)}
            <div class="bar-col">
              <span class="small">{switches.timeframes[option.value]}</span>
              <div class="bar" style:height="{(switches.timeframes[option.value] / switchMax) * 100}%"></div>
              <span class="muted small">{option.value}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if fronting && top.length > 0}
      <section class="panel">
        <h2>Top fronters</h2>
        <p class="muted small">Most active members for {timeframeLabel.toLowerCase()}</p>
        <ol class="ranking">
          {#each top as member, index (member.id)}
            <li>
              <span class="rank">{index + 1}</span>
              <img class="member-avatar avatar-sm" src={member.avatar_url || fallbackAvatar} alt="" onerror={avatarFallback} />
              <div class="grow">
                <p>{member.display_name || member.name} <span class="muted small">{duration(member[timeframe])}</span></p>
                <div class="meter"><div style:width="{(member[timeframe] / top[0]![timeframe]) * 100}%"></div></div>
              </div>
            </li>
          {/each}
        </ol>
      </section>
    {:else if fronting}
      <p class="panel muted">No fronting data available for the selected timeframe</p>
    {/if}
  {/if}
</div>

<style>
  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.15rem;
  }

  .timeframe {
    max-width: 16rem;
  }

  .stat .value {
    font-size: 2rem;
    font-weight: 700;
  }

  .donut-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    align-items: center;
  }

  .donut {
    width: min(16rem, 100%);
  }

  .legend {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .legend li {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .key {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 0.2rem;
  }

  .bars {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    align-items: end;
    height: 14rem;
  }

  .bar-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
  }

  .bar {
    width: 100%;
    min-height: 2px;
    border-radius: 0.5rem 0.5rem 0 0;
    background: var(--accent);
  }

  .ranking {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ranking li {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .rank {
    width: 1.5rem;
    color: var(--accent);
    font-weight: 700;
    text-align: right;
  }

  .meter {
    height: 0.4rem;
    margin-top: 0.25rem;
    overflow: hidden;
    border-radius: 999px;
    background: var(--line);
  }

  .meter div {
    height: 100%;
    background: var(--accent);
  }
</style>
