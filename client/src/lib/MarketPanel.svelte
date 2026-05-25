<script lang="ts">
  import { game } from './store.svelte';

  const RESOURCES = ['timber', 'stone', 'iron', 'grain'];
  let resource = $state('timber');
  let qty = $state(1000);
  let price = $state(500);
</script>

<h2>Marktplatz</h2>

<h3>Inserat erstellen</h3>
<div class="form">
  <select class="input" bind:value={resource}>
    {#each RESOURCES as r (r)}<option value={r}>{r}</option>{/each}
  </select>
  <input class="input num" type="number" min="1" bind:value={qty} title="Menge" />
  <span class="lbl">für</span>
  <input class="input num" type="number" min="0" bind:value={price} title="Gold" />
  <span class="lbl">Gold</span>
  <button class="btn primary" onclick={() => void game.createListing(resource, qty, price)}>Anbieten</button>
</div>
<p class="hint">Die angebotene Menge wird sofort aus deiner Stadt einbehalten (Market erforderlich). Bezahlte Ware reist nach Distanz.</p>

<h3>Offene Inserate</h3>
{#if game.market.length === 0}
  <p class="muted">Keine Inserate.</p>
{:else}
  {#each game.market as l (l.id)}
    <div class="listing">
      <span class="give mono">{l.give_qty.toLocaleString('de-DE')} {l.give_resource}</span>
      <span class="arrow">→</span>
      <span class="price mono">{l.want_gold.toLocaleString('de-DE')} Gold</span>
      <span class="seller">{l.username}</span>
      {#if l.seller_account === game.account?.id}
        <button class="btn" onclick={() => void game.cancelListing(l.id)}>Zurückziehen</button>
      {:else}
        <button class="btn primary" onclick={() => void game.acceptListing(l.id)}>Kaufen</button>
      {/if}
    </div>
  {/each}
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
  .form {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    flex-wrap: wrap;
  }
  .lbl {
    color: var(--text-muted);
    font-size: var(--fs-sm);
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
    width: 90px;
    font-family: var(--font-mono);
    text-align: right;
  }
  .listing {
    display: flex;
    gap: var(--sp-3);
    align-items: center;
    padding: 6px var(--sp-2);
    border-bottom: 1px solid var(--border-subtle);
    font-size: var(--fs-sm);
  }
  .give {
    color: var(--text-primary);
  }
  .arrow {
    color: var(--text-muted);
  }
  .price {
    color: var(--res-grain);
  }
  .seller {
    color: var(--text-secondary);
    margin-left: auto;
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
