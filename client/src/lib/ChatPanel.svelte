<script lang="ts">
  import { game } from './store.svelte';

  let activeChannel = $state<'global' | 'city' | 'alliance'>('global');
  let text = $state('');
  let log = $state<HTMLDivElement | null>(null);

  const messages = $derived(
    activeChannel === 'global' ? game.chatGlobal : activeChannel === 'city' ? game.chatCity : game.chatAlliance,
  );

  function send(): void {
    game.sendChat(text, activeChannel);
    text = '';
  }

  function time(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  // Bei neuer Nachricht oder Kanalwechsel ans Ende scrollen.
  $effect(() => {
    void messages.length;
    void activeChannel;
    if (log !== null) log.scrollTop = log.scrollHeight;
  });
</script>

<div class="head">
  <h2>Chat</h2>
  <div class="tabs">
    <button class="tab" class:active={activeChannel === 'global'} onclick={() => (activeChannel = 'global')}>Global</button>
    <button class="tab" class:active={activeChannel === 'city'} onclick={() => (activeChannel = 'city')}>Stadt</button>
    <button class="tab" class:active={activeChannel === 'alliance'} onclick={() => (activeChannel = 'alliance')}>Allianz</button>
  </div>
</div>
<div class="log" bind:this={log}>
  {#each messages as m, i (i)}
    <div class="msg">
      <span class="time mono">{time(m.at)}</span>
      <span class="user" class:me={m.username === game.account?.username}>{m.username}</span>
      <span class="text">{m.text}</span>
    </div>
  {:else}
    <p class="muted">
      {activeChannel === 'global'
        ? 'Noch keine Nachrichten. Sag Hallo!'
        : activeChannel === 'city'
          ? 'Stadt-Chat — sichtbar für alle, die diese Stadt sehen.'
          : 'Allianz-Chat — nur für Mitglieder deiner Allianz.'}
    </p>
  {/each}
</div>
<form
  onsubmit={(e) => {
    e.preventDefault();
    send();
  }}
>
  <input
    class="input"
    bind:value={text}
    placeholder={activeChannel === 'global' ? 'An alle…' : activeChannel === 'city' ? 'An die Stadt…' : 'An die Allianz…'}
    maxlength="500"
  />
  <button class="btn primary" type="submit">Senden</button>
</form>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--sp-3);
  }
  h2 {
    font-size: var(--fs-md);
    color: var(--text-secondary);
    margin: 0;
  }
  .tabs {
    display: flex;
    gap: 2px;
  }
  .tab {
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    padding: 4px var(--sp-2);
    font-size: var(--fs-xs);
  }
  .tab.active {
    background: var(--accent-soft);
    color: var(--text-primary);
    border-color: var(--accent-primary);
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
