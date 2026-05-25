<script lang="ts">
  import { game } from './store.svelte';

  const SIZE = 9;
  const COORDS = Array.from({ length: SIZE }, (_, i) => i);

  const GLYPH: Record<string, string> = {
    hall: '⌂',
    woodcutter_lodge: '🪵',
    quarry: '⛏',
    iron_mine: '⚒',
    farm: '🌾',
    sawmill: '🪚',
    stonemason: '🧱',
    foundry: '🔥',
    mill: '🌀',
    cottage: '🏠',
    warehouse: '📦',
    townhouse: '💰',
    city_wall: '🧱',
    watch_house: '🛡',
    training_yard: '⚔',
    stable: '🐎',
  };
  const NODE_COLOR: Record<string, string> = {
    wood: 'var(--res-timber)',
    stone: 'var(--res-stone)',
    iron: 'var(--res-iron)',
    grain: 'var(--res-grain)',
    lake: '#3f6f8f',
  };

  const tileMap = $derived(
    new Map((game.snapshot?.tiles ?? []).map((t) => [`${t.slotX},${t.slotY}`, t.nodeType])),
  );
  const buildMap = $derived(
    new Map((game.snapshot?.buildings ?? []).map((b) => [`${b.slotX},${b.slotY}`, b])),
  );
</script>

<h2>Stadt — {game.snapshot?.name}</h2>
<div class="grid">
  {#each COORDS as y (y)}
    {#each COORDS as x (x)}
      {@const b = buildMap.get(`${x},${y}`)}
      {@const node = tileMap.get(`${x},${y}`)}
      {@const sel = game.selected?.x === x && game.selected?.y === y}
      <button
        class="cell"
        class:built={b !== undefined}
        class:selected={sel}
        onclick={() => {
          game.select(x, y);
        }}
        title={b ? `${b.buildingKey} L${b.level} (+${b.adjacencyPct}%)` : (node ?? 'empty')}
      >
        {#if b}
          <span class="glyph">{GLYPH[b.buildingKey] ?? '▦'}</span>
          <span class="lvl mono">{b.level}</span>
        {:else if node && node !== 'empty'}
          <span class="node" style="background:{NODE_COLOR[node] ?? 'transparent'}"></span>
        {/if}
      </button>
    {/each}
  {/each}
</div>

<style>
  h2 {
    font-size: var(--fs-md);
    color: var(--text-secondary);
    margin: 0 0 var(--sp-3);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(9, 44px);
    grid-auto-rows: 44px;
    gap: 3px;
  }
  .cell {
    position: relative;
    border: 1px dashed var(--border-subtle);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .cell:hover {
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
  .cell.built {
    border-style: solid;
    border-color: var(--border-strong);
    background: var(--bg-raised);
  }
  .cell.selected {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px var(--accent-primary);
  }
  .glyph {
    font-size: 18px;
    line-height: 1;
  }
  .lvl {
    font-size: 9px;
    color: var(--accent-primary);
  }
  .node {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 8px;
    height: 8px;
    border-radius: var(--radius-sm);
  }
</style>
