<script lang="ts">
  import { VIRTUES, VIRTUE_NAMES, MAX_PALACE_LEVEL } from '@adelia/shared/constants/game';
  import { game } from './store.svelte';
  import Icon from './Icon.svelte';

  let virtue = $state<string>(VIRTUES[0]);

  const champion = $derived(
    game.leaderboard?.alliances.find((a) => a.id === game.endgame?.world?.champion_alliance),
  );

  function vname(key: string): string {
    return VIRTUE_NAMES[key as keyof typeof VIRTUE_NAMES] ?? key;
  }
</script>

<h2>Endgame — Tugenden & Sieg</h2>

{#if game.endgame?.world?.ended}
  <div class="victory">
    🏆 Die Welt von Adelia ist entschieden! Sieger:
    <strong>{champion ? `[${champion.tag}] ${champion.name}` : `Allianz #${game.endgame.world.champion_alliance}`}</strong>
  </div>
{/if}

<h3>Faith deiner Allianz</h3>
{#if game.endgame?.faith}
  {#each VIRTUES as v (v)}
    <div class="row">
      <span class="vic"><Icon name="shrine" size={13} /></span>
      <span class="virtue">{VIRTUE_NAMES[v]}</span>
      <span class="faith mono">Faith {game.endgame.faith[v] ?? 0}</span>
    </div>
  {/each}
{:else}
  <p class="muted">Tritt einer Allianz bei, um Paläste zu bauen und Faith zu sammeln.</p>
{/if}

<h3>Palast bauen / ausbauen</h3>
<p class="hint">
  Erfordert eine Allianz + einen aktiven Schrein der Tugend in Reichweite. 1 Palast/Stadt, max L{MAX_PALACE_LEVEL}. Sieg:
  L{MAX_PALACE_LEVEL}-Palast aller {VIRTUES.length} Tugenden.
</p>
<div class="form">
  <select class="input" bind:value={virtue}>
    {#each VIRTUES as v (v)}<option value={v}>{VIRTUE_NAMES[v]}</option>{/each}
  </select>
  <button class="btn primary" onclick={() => void game.buildPalace(virtue)}>
    In {game.snapshot?.name ?? 'dieser Stadt'} bauen
  </button>
</div>

<h3>Schreine</h3>
{#each game.endgame?.shrines ?? [] as s (s.id)}
  <div class="row">
    <span class="vic" class:on={s.active}><Icon name="shrine" size={13} /></span>
    <span class="virtue">{vname(s.virtue)}</span>
    <span class="loc mono">{s.x}:{s.y}</span>
    <span class="active" class:on={s.active}>{s.active ? 'aktiv' : 'inaktiv'}</span>
  </div>
{/each}

<h3>Ranglisten</h3>
<div class="cols">
  <div class="col">
    <div class="col-title">Spieler</div>
    {#each game.leaderboard?.players ?? [] as p (p.id)}
      <div class="rank-row"><span>{p.username}</span><span class="rp mono">{p.rank_points}</span></div>
    {/each}
  </div>
  <div class="col">
    <div class="col-title">Allianzen (Faith)</div>
    {#each game.leaderboard?.alliances ?? [] as a (a.id)}
      <div class="rank-row"><span>[{a.tag}] {a.name}</span><span class="rp mono">{a.faith}</span></div>
    {/each}
  </div>
</div>

{#if game.error}<div class="err">{game.error}</div>{/if}

<style>
  h2 {
    font-size: var(--fs-md);
    color: var(--text-secondary);
    margin: 0 0 var(--sp-3);
  }
  h3 {
    font-size: var(--fs-sm);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    margin: var(--sp-4) 0 var(--sp-2);
  }
  .victory {
    background: var(--accent-soft);
    border: 1px solid var(--accent-primary);
    border-radius: var(--radius-md);
    padding: var(--sp-3);
    color: var(--text-primary);
    font-size: var(--fs-md);
  }
  .row {
    display: flex;
    gap: var(--sp-3);
    align-items: center;
    padding: 3px 0;
    font-size: var(--fs-sm);
  }
  .vic {
    line-height: 0;
    color: var(--accent-primary);
  }
  .vic.on {
    color: var(--res-gold);
  }
  .virtue {
    color: var(--text-primary);
    min-width: 110px;
  }
  .faith {
    color: var(--res-grain);
  }
  .loc {
    color: var(--text-muted);
  }
  .active {
    color: var(--text-muted);
    margin-left: auto;
    font-size: var(--fs-xs);
  }
  .active.on {
    color: var(--res-grain);
  }
  .form {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .input {
    height: 28px;
    background: var(--bg-raised);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    padding: 0 var(--sp-2);
    font-family: var(--font-ui);
  }
  .btn {
    height: 28px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg-raised);
    color: var(--text-primary);
    font-weight: 500;
  }
  .btn.primary {
    background: var(--accent-primary);
    color: var(--text-inverse);
    border-color: var(--accent-primary);
    font-weight: 600;
  }
  .hint {
    color: var(--text-muted);
    font-size: var(--fs-xs);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .cols {
    display: flex;
    gap: var(--sp-4);
  }
  .col {
    flex: 1;
  }
  .col-title {
    font-size: var(--fs-xs);
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: var(--sp-1);
  }
  .rank-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--fs-sm);
    padding: 2px 0;
    color: var(--text-primary);
  }
  .rp {
    color: var(--text-muted);
  }
  .err {
    background: var(--status-error);
    color: #fff;
    padding: var(--sp-2);
    border-radius: var(--radius-md);
    font-size: var(--fs-xs);
    margin-top: var(--sp-2);
  }
</style>
