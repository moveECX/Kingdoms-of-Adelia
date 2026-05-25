<script lang="ts">
  import { game } from './store.svelte';

  const TRAINABLE = ['city_guard', 'berserker', 'ranger', 'guardian', 'knight'];

  let trainUnit = $state('berserker');
  let trainQty = $state(10);
  let raidQty = $state(40);
</script>

<h2>Militär — {game.snapshot?.name}</h2>

<h3>Garnison</h3>
{#if game.snapshot && game.snapshot.garrison.length > 0}
  {#each game.snapshot.garrison as g (g.unitKey)}
    <div class="line mono">{g.unitKey} × {g.qty}</div>
  {/each}
{:else}
  <p class="muted">Keine Truppen stationiert.</p>
{/if}

<h3>Ausbilden</h3>
<div class="form">
  <select class="input" bind:value={trainUnit}>
    {#each TRAINABLE as u (u)}<option value={u}>{u}</option>{/each}
  </select>
  <input class="input num" type="number" min="1" bind:value={trainQty} />
  <button class="btn" onclick={() => void game.train(trainUnit, trainQty)}>Ausbilden</button>
</div>

{#if game.selectedDungeon}
  <h3>Raid</h3>
  <div class="dungeon">
    Ziel: {game.selectedDungeon.type} · Stufe {game.selectedDungeon.level} · {game.selectedDungeon.completion}%
  </div>
  <div class="form">
    <input class="input num" type="number" min="1" bind:value={raidQty} />
    <button class="btn primary" onclick={() => void game.raid({ berserker: raidQty })}>
      {raidQty} Berserker entsenden
    </button>
  </div>
  <p class="hint">Truppen reisen zum Dungeon, kämpfen und kehren mit Beute zurück.</p>
{:else}
  <p class="muted">Wähle einen Dungeon auf der Weltkarte, um zu raiden.</p>
{/if}

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
  .line {
    padding: 2px 0;
    color: var(--text-primary);
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
  .num {
    width: 72px;
    font-family: var(--font-mono);
    text-align: right;
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
  .btn:hover {
    border-color: var(--accent-primary);
  }
  .dungeon {
    font-size: var(--fs-sm);
    color: var(--text-primary);
    margin-bottom: var(--sp-2);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .hint {
    color: var(--text-muted);
    font-size: var(--fs-xs);
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
