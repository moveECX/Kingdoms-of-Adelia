<script lang="ts">
  import { onMount } from 'svelte';
  import { game, type View } from './lib/store.svelte';
  import ResourceBar from './lib/ResourceBar.svelte';
  import CityGrid from './lib/CityGrid.svelte';
  import BuildPanel from './lib/BuildPanel.svelte';
  import WorldMap from './lib/WorldMap.svelte';
  import MilitaryPanel from './lib/MilitaryPanel.svelte';

  onMount(() => {
    void game.init();
  });

  const NAV: ReadonlyArray<{ view: View; label: string }> = [
    { view: 'city', label: '▦ Stadt' },
    { view: 'map', label: '🜨 Weltkarte' },
    { view: 'military', label: '⚔ Militär' },
  ];
</script>

<ResourceBar />
<div class="shell">
  <nav class="sidebar">
    {#each NAV as n (n.view)}
      <button class="nav-item" class:active={game.view === n.view} onclick={() => void game.setView(n.view)}>
        {n.label}
      </button>
    {/each}
  </nav>
  <main class="main">
    {#if game.snapshot === null && game.error !== null}
      <div class="err">{game.error}</div>
    {:else if game.snapshot === null}
      <div class="muted">Lade Stadt…</div>
    {:else if game.view === 'map'}
      <WorldMap />
    {:else if game.view === 'military'}
      <MilitaryPanel />
    {:else}
      <CityGrid />
    {/if}
  </main>
  {#if game.view === 'city'}
    <aside class="context"><BuildPanel /></aside>
  {/if}
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 160px 1fr auto;
    height: calc(100vh - 32px);
  }
  .sidebar {
    background: var(--bg-elevated);
    border-right: 1px solid var(--border-subtle);
    padding: var(--sp-2);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 6px var(--sp-2);
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    color: var(--text-secondary);
  }
  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  .nav-item.active {
    background: var(--accent-soft);
    color: var(--text-primary);
    box-shadow: inset 2px 0 0 var(--accent-primary);
  }
  .main {
    padding: var(--sp-4);
    overflow: auto;
  }
  .context {
    width: 300px;
    background: var(--bg-elevated);
    border-left: 1px solid var(--border-subtle);
    padding: var(--sp-3);
    overflow: auto;
  }
  .err {
    background: var(--status-error);
    color: #fff;
    padding: var(--sp-2);
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
  }
  .muted {
    color: var(--text-muted);
  }
</style>
