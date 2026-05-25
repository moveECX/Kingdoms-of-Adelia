<script lang="ts">
  import { game } from './store.svelte';

  const W = 620;
  const H = 440;
  const TILE = 26;

  let canvas = $state<HTMLCanvasElement | null>(null);

  const DUNGEON_COLOR: Record<string, string> = {
    forest: '#6f9d57',
    hill: '#9aa0a8',
    mountain: '#6f8fa8',
    sea: '#3f6f8f',
  };

  function center(): { x: number; y: number } {
    return game.mapData?.cities[0] ?? { x: 100, y: 100 };
  }
  function screen(x: number, y: number): { sx: number; sy: number } {
    const c = center();
    return { sx: W / 2 + (x - c.x) * TILE, sy: H / 2 + (y - c.y) * TILE };
  }

  function draw(): void {
    const ctx = canvas?.getContext('2d');
    const map = game.mapData;
    if (ctx === null || ctx === undefined || map === null) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0f12';
    ctx.fillRect(0, 0, W, H);

    // dezentes Gitter
    ctx.strokeStyle = '#1c2027';
    ctx.lineWidth = 1;
    for (let gx = (W / 2) % TILE; gx < W; gx += TILE) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = (H / 2) % TILE; gy < H; gy += TILE) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    ctx.font = '10px monospace';
    for (const d of map.dungeons) {
      const { sx, sy } = screen(d.x, d.y);
      const sel = game.selectedDungeon?.x === d.x && game.selectedDungeon.y === d.y;
      ctx.fillStyle = DUNGEON_COLOR[d.dungeon_type] ?? '#888';
      ctx.beginPath();
      ctx.arc(sx, sy, sel ? 11 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d0f12';
      ctx.fillText(`${d.level}`, sx - 3, sy + 3);
    }
    for (const c of map.cities) {
      const { sx, sy } = screen(c.x, c.y);
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(sx - 7, sy - 7, 14, 14);
    }
  }

  $effect(() => {
    void game.mapData;
    void game.selectedDungeon;
    draw();
  });

  function onClick(ev: MouseEvent): void {
    const map = game.mapData;
    if (canvas === null || map === null) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    for (const d of map.dungeons) {
      const { sx, sy } = screen(d.x, d.y);
      if (Math.hypot(mx - sx, my - sy) < 13) {
        game.selectDungeon({ x: d.x, y: d.y, type: d.dungeon_type, level: d.level, completion: d.completion });
        return;
      }
    }
  }
</script>

<h2>Weltkarte</h2>
<canvas bind:this={canvas} width={W} height={H} onclick={onClick} class="map"></canvas>
<p class="hint">● Dungeon (Zahl = Level) · ▢ Stadt — klick einen Dungeon an, um einen Raid zu planen.</p>

<style>
  h2 {
    font-size: var(--fs-md);
    color: var(--text-secondary);
    margin: 0 0 var(--sp-3);
  }
  .map {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    cursor: crosshair;
  }
  .hint {
    color: var(--text-muted);
    font-size: var(--fs-xs);
    margin-top: var(--sp-2);
  }
</style>
