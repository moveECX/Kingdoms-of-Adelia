<script lang="ts">
  import { game } from './store.svelte';

  let name = $state('');
  let tag = $state('');

  const my = $derived(game.myAlliance);
  const isLeader = $derived(my?.myRank === 'leader');
  const canDiplo = $derived(my?.myRank === 'leader' || my?.myRank === 'officer');

  function tagOf(id: number): string {
    return game.alliances.find((a) => a.id === id)?.tag ?? `#${id}`;
  }
  function time(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
  }
</script>

<h2>Allianzen</h2>

{#if my && my.alliance}
  <div class="card">
    <div class="title">{my.alliance.name} <span class="tag">[{my.alliance.tag}]</span></div>
    <button class="btn" onclick={() => void game.leaveAlliance()}>Verlassen</button>
  </div>

  <h3>Mitglieder ({(my.members ?? []).length}/100)</h3>
  {#each my.members ?? [] as m (m.id)}
    <div class="row">
      <span class="who">{m.username}</span>
      <span class="rank">{m.alliance_rank}</span>
      {#if isLeader && m.id !== game.account?.id}
        <button class="btn sm" onclick={() => void game.setRank(m.id, 'officer')}>→Officer</button>
        <button class="btn sm" onclick={() => void game.setRank(m.id, 'member')}>→Member</button>
        <button class="btn sm" onclick={() => void game.setRank(m.id, 'leader')} title="Führung übertragen">→Leader</button>
      {/if}
    </div>
  {/each}

  {#if canDiplo}
    <h3>Diplomatie</h3>
    {#each game.alliances.filter((a) => a.id !== my.alliance?.id) as a (a.id)}
      <div class="row">
        <span class="who">[{a.tag}] {a.name}</span>
        <button class="btn sm" onclick={() => void game.setDiplomacy(a.id, 'allied')}>Allied</button>
        <button class="btn sm" onclick={() => void game.setDiplomacy(a.id, 'nap')}>NAP</button>
        <button class="btn sm" onclick={() => void game.setDiplomacy(a.id, 'enemy')}>Enemy</button>
      </div>
    {/each}
    {#each my.diplomacy ?? [] as d (d.id)}
      <div class="diplo {d.status}">
        {tagOf(d.alliance_a === my.alliance.id ? d.alliance_b : d.alliance_a)}: {d.status}
      </div>
    {/each}
  {/if}

  <h3>Ereignisse</h3>
  {#each my.events ?? [] as ev (ev.id)}
    <div class="event"><span class="time">{time(ev.at)}</span> {ev.text}</div>
  {:else}
    <p class="muted">Keine Ereignisse.</p>
  {/each}
{:else}
  <h3>Allianz gründen</h3>
  <div class="form">
    <input class="input" placeholder="Name" bind:value={name} />
    <input class="input sm" placeholder="Tag" bind:value={tag} maxlength="6" />
    <button class="btn primary" onclick={() => void game.createAlliance(name, tag)}>Gründen</button>
  </div>

  <h3>Beitreten</h3>
  {#each game.alliances as a (a.id)}
    <div class="row">
      <span class="who">[{a.tag}] {a.name}</span>
      <span class="count mono">{a.members}/100</span>
      <button class="btn sm" onclick={() => void game.joinAlliance(a.id)}>Beitreten</button>
    </div>
  {:else}
    <p class="muted">Noch keine Allianzen — gründe die erste!</p>
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
  .card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--sp-2) var(--sp-3);
  }
  .title {
    color: var(--text-primary);
    font-weight: 600;
  }
  .tag {
    color: var(--accent-primary);
  }
  .row {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    padding: 4px 0;
    font-size: var(--fs-sm);
  }
  .who {
    color: var(--text-primary);
  }
  .rank {
    color: var(--accent-primary);
    font-size: var(--fs-xs);
    text-transform: capitalize;
  }
  .count {
    color: var(--text-muted);
    margin-left: auto;
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
  .input.sm {
    width: 80px;
  }
  .btn {
    height: 28px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg-raised);
    color: var(--text-primary);
    font-weight: 500;
    margin-left: auto;
  }
  .btn.sm {
    margin-left: 0;
    font-size: var(--fs-xs);
  }
  .btn.primary {
    background: var(--accent-primary);
    color: var(--text-inverse);
    border-color: var(--accent-primary);
    font-weight: 600;
  }
  .diplo {
    font-size: var(--fs-xs);
    padding: 2px 0;
  }
  .diplo.allied {
    color: var(--res-grain);
  }
  .diplo.enemy {
    color: var(--status-error);
  }
  .diplo.nap {
    color: var(--text-secondary);
  }
  .event {
    font-size: var(--fs-xs);
    color: var(--text-secondary);
    padding: 2px 0;
  }
  .time {
    color: var(--text-muted);
    margin-right: var(--sp-2);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--fs-sm);
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
