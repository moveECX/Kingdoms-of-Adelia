<script lang="ts">
  import { game } from './store.svelte';
  import type { CombatReport } from './types';

  function time(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
  }
  function isAttacker(r: CombatReport): boolean {
    return r.attacker_id !== null && r.attacker_id === game.account?.id;
  }
  function kindOf(r: CombatReport): string {
    const k = r.detail['kind'];
    return typeof k === 'string' ? k : 'Kampf';
  }
</script>

<h2>Kampfberichte</h2>
{#if game.reports.length === 0}
  <p class="muted">Noch keine Kampfberichte.</p>
{:else}
  {#each game.reports as r (r.id)}
    <div class="report">
      <div class="head">
        <span class="role" class:atk={isAttacker(r)}>{isAttacker(r) ? '⚔ Angriff' : '🛡 Verteidigung'}</span>
        <span class="kind">{kindOf(r)}</span>
        <span class="loc mono">{r.target_x}:{r.target_y}</span>
        <span class="time">{time(r.occurred_at)}</span>
      </div>
      <pre class="detail">{JSON.stringify(r.detail, null, 2)}</pre>
    </div>
  {/each}
{/if}

<style>
  h2 {
    font-size: var(--fs-md);
    color: var(--text-secondary);
    margin: 0 0 var(--sp-3);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  .report {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--sp-2);
    margin-bottom: var(--sp-2);
    background: var(--bg-elevated);
  }
  .head {
    display: flex;
    gap: var(--sp-3);
    align-items: center;
    font-size: var(--fs-sm);
    margin-bottom: var(--sp-2);
  }
  .role {
    color: var(--res-grain);
    font-weight: 600;
  }
  .role.atk {
    color: var(--accent-primary);
  }
  .kind {
    color: var(--text-secondary);
    text-transform: capitalize;
  }
  .loc {
    color: var(--text-muted);
  }
  .time {
    color: var(--text-muted);
    font-size: var(--fs-xs);
    margin-left: auto;
  }
  .detail {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
