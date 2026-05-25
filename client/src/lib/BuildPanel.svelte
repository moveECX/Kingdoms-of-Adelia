<script lang="ts">
  import { buildingCost } from '@adelia/shared/formulas/cost';
  import { buildTimeSec } from '@adelia/shared/formulas/buildtime';
  import { baseProductionPerH } from '@adelia/shared/formulas/production';
  import { game } from './store.svelte';

  const current = $derived.by(() => {
    const sel = game.selected;
    const snap = game.snapshot;
    if (sel === null || snap === null) return null;
    return snap.buildings.find((b) => b.slotX === sel.x && b.slotY === sel.y) ?? null;
  });

  const queued = $derived.by(() => {
    const sel = game.selected;
    const snap = game.snapshot;
    if (sel === null || snap === null) return null;
    return snap.queue.find((q) => q.slotX === sel.x && q.slotY === sel.y) ?? null;
  });

  const hallLevel = $derived(
    game.snapshot?.buildings.find((b) => b.buildingKey === 'hall')?.level ?? 0,
  );

  const buildable = $derived(
    current !== null
      ? []
      : Object.entries(game.buildingDefs)
          .filter(([, def]) => (def.prereq?.hall ?? 0) <= hallLevel && def.onePerCity !== true)
          .map(([key, def]) => ({ key, def })),
  );

  function costStr(key: string, level: number): string {
    const def = game.buildingDefs[key];
    if (def?.cost === undefined) return '';
    try {
      const c = buildingCost({ cost: def.cost }, level);
      return `${c.timber}🪵 ${c.stone}🪨`;
    } catch {
      return '';
    }
  }
  function timeStr(key: string, level: number): string {
    const def = game.buildingDefs[key];
    if (def?.buildTimeSec === undefined) return '';
    try {
      const s = buildTimeSec({ buildTimeSec: def.buildTimeSec }, level, game.snapshot?.constructionPct ?? 100);
      if (s < 60) return `${String(Math.round(s))}s`;
      if (s < 3600) return `${String(Math.round(s / 60))}m`;
      return `${(s / 3600).toFixed(1)}h`;
    } catch {
      return '';
    }
  }
  function outStr(key: string, level: number): string {
    const def = game.buildingDefs[key];
    if (def?.outputPerH === undefined) return '';
    try {
      return `+${String(baseProductionPerH({ outputPerH: def.outputPerH }, level))}/h`;
    } catch {
      return '';
    }
  }
</script>

{#if game.error}<div class="err">{game.error}</div>{/if}

<h3>{game.selected ? `Slot (${game.selected.x}, ${game.selected.y})` : 'Kein Slot gewählt'}</h3>

{#if game.selected === null}
  <p class="muted">Wähle einen Slot im Stadtraster.</p>
{:else if queued}
  <p class="muted">⏳ In Bau: {queued.buildingKey} → Stufe {queued.toLevel}</p>
{:else if current}
  {@const cur = current}
  {@const def = game.buildingDefs[cur.buildingKey]}
  <div class="info">
    <div class="name">{def?.name ?? cur.buildingKey} · L{cur.level}</div>
    <div class="muted">Adjazenz +{cur.adjacencyPct}% · {cur.productionH}/h</div>
    {#if cur.level < (def?.maxLevel ?? 10)}
      <button class="btn" onclick={() => void game.build(cur.buildingKey)}>
        Ausbau → L{cur.level + 1} · {costStr(cur.buildingKey, cur.level + 1)} · {timeStr(cur.buildingKey, cur.level + 1)}
      </button>
    {:else}
      <div class="muted">Maximalstufe erreicht.</div>
    {/if}
  </div>
{:else}
  <p class="muted">Leerer Slot — Gebäude bauen:</p>
  <div class="list">
    {#each buildable as { key, def } (key)}
      <button class="opt" onclick={() => void game.build(key)}>
        <div class="opt-name">{def.name}</div>
        <div class="opt-meta mono">{costStr(key, 1)} · {timeStr(key, 1)} · {outStr(key, 1)}</div>
      </button>
    {/each}
  </div>
{/if}

{#if game.snapshot && game.snapshot.queue.length > 0}
  <h3 class="qh">Bau-Queue ({game.snapshot.queue.length})</h3>
  {#each game.snapshot.queue as q (q.jobId)}
    <div class="q mono">{game.buildingDefs[q.buildingKey]?.name ?? q.buildingKey} → L{q.toLevel}</div>
  {/each}
{/if}

<style>
  h3 {
    font-size: var(--fs-md);
    margin: 0 0 var(--sp-2);
  }
  .qh {
    margin-top: var(--sp-4);
    color: var(--text-secondary);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .name {
    font-weight: 600;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .opt,
  .btn {
    text-align: left;
    background: var(--bg-raised);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    padding: var(--sp-2);
    font-size: var(--fs-sm);
  }
  .opt:hover,
  .btn:hover {
    border-color: var(--accent-primary);
    background: var(--bg-hover);
  }
  .btn {
    background: var(--accent-primary);
    color: var(--text-inverse);
    font-weight: 600;
    border-color: var(--accent-primary);
  }
  .opt-meta {
    color: var(--text-muted);
    font-size: var(--fs-xs);
    margin-top: 2px;
  }
  .q {
    font-size: var(--fs-sm);
    color: var(--text-secondary);
    padding: 2px 0;
  }
  .err {
    background: var(--status-error);
    color: #fff;
    padding: var(--sp-2);
    border-radius: var(--radius-md);
    font-size: var(--fs-xs);
    margin-bottom: var(--sp-2);
  }
</style>
