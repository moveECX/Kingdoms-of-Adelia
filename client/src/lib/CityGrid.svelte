<script lang="ts">
  import { game } from './store.svelte';
  import Icon from './Icon.svelte';
  import { iconForBuilding, iconForNode, NODE_COLOR } from './icons';

  const SIZE = 9;
  const COORDS = Array.from({ length: SIZE }, (_, i) => i);

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
      {@const hasNode = node !== undefined && node !== 'empty'}
      <button
        class="cell"
        class:built={b !== undefined}
        class:selected={sel}
        class:node={hasNode && b === undefined}
        style={hasNode && b === undefined ? `--tile:${NODE_COLOR[node] ?? 'transparent'}` : ''}
        onclick={() => {
          game.select(x, y);
        }}
        title={b ? `${b.buildingKey} L${b.level} (+${b.adjacencyPct}%)` : (node ?? 'empty')}
      >
        {#if b}
          <span class="glyph"><Icon name={iconForBuilding(b.buildingKey)} size={22} /></span>
          <span class="lvl mono">{b.level}</span>
        {:else if hasNode}
          <span class="terrain" style="color:{NODE_COLOR[node] ?? 'var(--text-muted)'}">
            <Icon name={iconForNode(node)} size={18} />
          </span>
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
  .cell.node {
    /* dezente Terrain-Tönung der freien Knoten-Felder */
    background: color-mix(in srgb, var(--tile) 14%, transparent);
    border-color: color-mix(in srgb, var(--tile) 35%, var(--border-subtle));
  }
  .cell.built {
    border-style: solid;
    border-color: var(--border-strong);
    background: var(--bg-raised);
    color: var(--accent-primary);
  }
  .cell.selected {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px var(--accent-primary);
  }
  .glyph {
    line-height: 0;
  }
  .lvl {
    font-size: 9px;
    color: var(--accent-primary);
    margin-top: 1px;
  }
  .terrain {
    line-height: 0;
    opacity: 0.85;
  }
</style>
