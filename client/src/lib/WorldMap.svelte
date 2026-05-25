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
    if (game.snapshot !== null) return { x: game.snapshot.x, y: game.snapshot.y };
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

    // Dungeons: typgefärbte Scheibe mit Stufe; ausgewählt = Goldring.
    for (const d of map.dungeons) {
      const { sx, sy } = screen(d.x, d.y);
      const sel = game.selectedDungeon?.x === d.x && game.selectedDungeon.y === d.y;
      if (sel) {
        ctx.strokeStyle = '#d9a441';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = DUNGEON_COLOR[d.dungeon_type] ?? '#888';
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0d0f12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#0d0f12';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(d.level), sx, sy);
    }
    // Städte: kleine Burg (Körper + Zinnen + Tor); eigene gold, fremde blau.
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    for (const c of map.cities) {
      const { sx, sy } = screen(c.x, c.y);
      ctx.fillStyle = c.account_id === game.account?.id ? '#d9a441' : '#5a7a9a';
      ctx.fillRect(sx - 7, sy - 3, 14, 9); // Körper
      ctx.fillRect(sx - 7, sy - 7, 3, 4); // Zinnen
      ctx.fillRect(sx - 1.5, sy - 7, 3, 4);
      ctx.fillRect(sx + 4, sy - 7, 3, 4);
      ctx.fillStyle = '#0d0f12';
      ctx.fillRect(sx - 2, sy, 4, 6); // Tor
      ctx.fillStyle = '#aab2bd';
      ctx.font = '10px sans-serif';
      ctx.fillText(c.username, sx + 11, sy + 4);
    }
  }

  $effect(() => {
    void game.mapData;
    void game.selectedDungeon;
    void game.account;
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
    // Klick auf eine fremde Stadt → als Angriffsziel wählen.
    for (const c of map.cities) {
      if (c.account_id === game.account?.id) continue;
      const { sx, sy } = screen(c.x, c.y);
      if (Math.abs(mx - sx) <= 8 && Math.abs(my - sy) <= 8) {
        game.selectTarget(c);
        return;
      }
    }
  }
</script>

<h2>Weltkarte</h2>
<canvas bind:this={canvas} width={W} height={H} onclick={onClick} class="map"></canvas>
<p class="hint">
  ▢ <span class="own">eigene</span> · ▢ <span class="foreign">fremde</span> Stadt · ● Dungeon (Zahl = Level) — klick einen Dungeon für einen Raid.
</p>

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
  .own {
    color: #d9a441;
  }
  .foreign {
    color: #5a7a9a;
  }
</style>
