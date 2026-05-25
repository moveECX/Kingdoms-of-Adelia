<script lang="ts">
  import { onMount } from 'svelte';
  import { game, type View } from './lib/store.svelte';
  import ResourceBar from './lib/ResourceBar.svelte';
  import CityGrid from './lib/CityGrid.svelte';
  import BuildPanel from './lib/BuildPanel.svelte';
  import WorldMap from './lib/WorldMap.svelte';
  import MilitaryPanel from './lib/MilitaryPanel.svelte';
  import ChatPanel from './lib/ChatPanel.svelte';
  import ReportsPanel from './lib/ReportsPanel.svelte';
  import MarketPanel from './lib/MarketPanel.svelte';
  import LoginPanel from './lib/LoginPanel.svelte';

  onMount(() => {
    void game.init();
  });

  const NAV: ReadonlyArray<{ view: View; label: string }> = [
    { view: 'city', label: '▦ Stadt' },
    { view: 'map', label: '🜨 Weltkarte' },
    { view: 'military', label: '⚔ Militär' },
    { view: 'reports', label: '⚑ Berichte' },
    { view: 'market', label: '🛒 Markt' },
    { view: 'chat', label: '💬 Chat' },
  ];
</script>

{#if !game.authChecked}
  <div class="boot">Lade…</div>
{:else if game.account === null}
  <LoginPanel />
{:else}
  <ResourceBar />
  <div class="shell">
    <nav class="sidebar">
      <div class="account">
        <div class="who">{game.account.username}</div>
        <div class="title">{game.account.title}</div>
        <button class="logout" onclick={() => void game.logout()}>Abmelden</button>
      </div>
      {#each NAV as n (n.view)}
        <button class="nav-item" class:active={game.view === n.view} onclick={() => void game.setView(n.view)}>
          {n.label}
        </button>
      {/each}
    </nav>
    <main class="main">
      {#if game.view === 'chat'}
        <ChatPanel />
      {:else if game.view === 'reports'}
        <ReportsPanel />
      {:else if game.view === 'market'}
        <MarketPanel />
      {:else if game.snapshot === null && game.error !== null}
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
{/if}

<style>
  .boot {
    display: grid;
    place-items: center;
    height: 100vh;
    color: var(--text-muted);
  }
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
  .account {
    padding: var(--sp-2);
    margin-bottom: var(--sp-2);
    border-bottom: 1px solid var(--border-subtle);
  }
  .who {
    color: var(--text-primary);
    font-weight: 600;
    font-size: var(--fs-sm);
  }
  .title {
    color: var(--accent-primary);
    font-size: var(--fs-xs);
    text-transform: capitalize;
    margin-bottom: var(--sp-2);
  }
  .logout {
    width: 100%;
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    padding: 4px;
    font-size: var(--fs-xs);
  }
  .logout:hover {
    border-color: var(--accent-primary);
    color: var(--text-primary);
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
