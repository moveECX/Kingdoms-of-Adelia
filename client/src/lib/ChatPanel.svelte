<script lang="ts">
  import { game } from './store.svelte';

  let text = $state('');
  let log = $state<HTMLDivElement | null>(null);

  function send(): void {
    game.sendChat(text);
    text = '';
  }

  function time(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  // Nach jeder neuen Nachricht ans Ende scrollen.
  $effect(() => {
    void game.chat.length;
    if (log !== null) log.scrollTop = log.scrollHeight;
  });
</script>

<h2>Globaler Chat</h2>
<div class="log" bind:this={log}>
  {#each game.chat as m, i (i)}
    <div class="msg">
      <span class="time mono">{time(m.at)}</span>
      <span class="user" class:me={m.username === game.account?.username}>{m.username}</span>
      <span class="text">{m.text}</span>
    </div>
  {:else}
    <p class="muted">Noch keine Nachrichten. Sag Hallo!</p>
  {/each}
</div>
<form
  onsubmit={(e) => {
    e.preventDefault();
    send();
  }}
>
  <input class="input" bind:value={text} placeholder="Nachricht…" maxlength="500" />
  <button class="btn primary" type="submit">Senden</button>
</form>

<style>
  h2 {
    font-size: var(--fs-md);
    color: var(--text-secondary);
    margin: 0 0 var(--sp-3);
  }
  .log {
    height: calc(100vh - 180px);
    overflow-y: auto;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--sp-2);
    display: flex;
    flex-direction: column;
    gap: 3px;
    background: var(--bg-base);
  }
  .msg {
    font-size: var(--fs-sm);
    line-height: 1.4;
  }
  .time {
    color: var(--text-muted);
    font-size: var(--fs-xs);
    margin-right: var(--sp-2);
  }
  .user {
    color: var(--accent-primary);
    font-weight: 600;
    margin-right: var(--sp-2);
  }
  .user.me {
    color: var(--res-grain);
  }
  .text {
    color: var(--text-primary);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }
  form {
    display: flex;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
  .input {
    flex: 1;
    height: 30px;
    background: var(--bg-raised);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    padding: 0 var(--sp-2);
    font-family: var(--font-ui);
  }
  .btn {
    height: 30px;
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
</style>
