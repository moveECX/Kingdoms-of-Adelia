<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from './lib/store.svelte';
  import ResourceBar from './lib/ResourceBar.svelte';
  import CityGrid from './lib/CityGrid.svelte';
  import BuildPanel from './lib/BuildPanel.svelte';

  onMount(() => {
    void game.init();
  });
</script>

<ResourceBar />
<div class="shell">
  <nav class="sidebar">
    <div class="nav-item active">▦ Stadt</div>
    <div class="nav-item muted">🜨 Weltkarte</div>
    <div class="nav-item muted">⚔ Militär</div>
    <div class="nav-item muted">⇄ Markt</div>
  </nav>
  <main class="main">
    {#if game.snapshot}
      <CityGrid />
    {:else if game.error}
      <div class="err">{game.error}</div>
    {:else}
      <div class="muted">Lade Stadt…</div>
    {/if}
  </main>
  <aside class="context"><BuildPanel /></aside>
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 160px 1fr 300px;
    height: calc(100vh - 32px);
  }
  .sidebar {
    background: var(--bg-elevated);
    border-right: 1px solid var(--border-subtle);
    padding: var(--sp-2);
  }
  .nav-item {
    padding: 6px var(--sp-2);
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    color: var(--text-secondary);
  }
  .nav-item.active {
    background: var(--accent-soft);
    color: var(--text-primary);
    box-shadow: inset 2px 0 0 var(--accent-primary);
  }
  .nav-item.muted {
    color: var(--text-muted);
  }
  .main {
    padding: var(--sp-4);
    overflow: auto;
  }
  .context {
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
