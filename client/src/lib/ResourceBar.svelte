<script lang="ts">
  import { deriveAmount } from '@adelia/shared/formulas/resources';
  import { game } from './store.svelte';
  import type { ResourceKey } from './types';

  // Lokaler 1s-Ticker für flüssige Interpolation (gleiche Formel wie der Server).
  let nowMs = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => {
      nowMs = Date.now();
    }, 1000);
    return () => {
      clearInterval(id);
    };
  });

  const RES: ReadonlyArray<{ key: ResourceKey; label: string; color: string }> = [
    { key: 'timber', label: 'Timber', color: 'var(--res-timber)' },
    { key: 'stone', label: 'Stone', color: 'var(--res-stone)' },
    { key: 'iron', label: 'Iron', color: 'var(--res-iron)' },
    { key: 'grain', label: 'Grain', color: 'var(--res-grain)' },
  ];

  function live(key: ResourceKey): number {
    const snap = game.snapshot;
    if (snap === null) return 0;
    const r = snap.resources[key];
    return deriveAmount({
      amount: r.amount,
      ratePerH: r.ratePerH,
      cap: r.cap,
      elapsedMs: nowMs - new Date(snap.now).getTime(),
    });
  }
</script>

<div class="hud">
  <span class="brand">⛬ ADELIA</span>
  {#if game.snapshot}
    {#each RES as r (r.key)}
      <span class="res" title={r.label}>
        <span class="dot" style="background:{r.color}"></span>
        <span class="amt mono">{live(r.key).toLocaleString('de-DE')}</span>
        <span class="rate mono">+{game.snapshot.resources[r.key].ratePerH}/h</span>
      </span>
    {/each}
    <span class="res build">⚙ {game.snapshot.constructionPct}%</span>
  {/if}
</div>

<style>
  .hud {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    height: 32px;
    padding: 0 var(--sp-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-strong);
  }
  .brand {
    color: var(--accent-primary);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .res {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-sm);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-sm);
  }
  .rate {
    color: var(--text-muted);
    font-size: var(--fs-xs);
  }
  .build {
    color: var(--text-secondary);
    margin-left: auto;
  }
</style>
