<script lang="ts">
  import { game } from './store.svelte';

  let mode = $state<'login' | 'register'>('login');
  let username = $state('');
  let email = $state('');
  let password = $state('');

  async function submit(): Promise<void> {
    if (mode === 'login') await game.login(username, password);
    else await game.register(username, email, password);
  }
</script>

<div class="wrap">
  <div class="card">
    <div class="brand">⛬ KINGDOMS OF ADELIA</div>
    <div class="tabs">
      <button class="tab" class:active={mode === 'login'} onclick={() => (mode = 'login')}>Anmelden</button>
      <button class="tab" class:active={mode === 'register'} onclick={() => (mode = 'register')}>Registrieren</button>
    </div>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label>
        Benutzername
        <input class="input" bind:value={username} autocomplete="username" minlength="3" required />
      </label>
      {#if mode === 'register'}
        <label>
          E-Mail
          <input class="input" type="email" bind:value={email} autocomplete="email" required />
        </label>
      {/if}
      <label>
        Passwort
        <input class="input" type="password" bind:value={password} autocomplete="current-password" minlength="6" required />
      </label>
      <button class="btn primary" type="submit">
        {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
      </button>
    </form>
    {#if game.error}<div class="err">{game.error}</div>{/if}
    <p class="hint">Demo-Login: <code>dev</code> / <code>password123</code></p>
  </div>
</div>

<style>
  .wrap {
    display: grid;
    place-items: center;
    height: 100vh;
    background: var(--bg-base);
  }
  .card {
    width: 320px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--sp-4);
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
  .brand {
    color: var(--accent-primary);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-align: center;
    font-size: var(--fs-md);
  }
  .tabs {
    display: flex;
    gap: 2px;
  }
  .tab {
    flex: 1;
    background: var(--bg-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    padding: 6px;
    font-size: var(--fs-sm);
  }
  .tab.active {
    background: var(--accent-soft);
    color: var(--text-primary);
    border-color: var(--accent-primary);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--fs-xs);
    color: var(--text-secondary);
  }
  .input {
    height: 30px;
    background: var(--bg-raised);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    padding: 0 var(--sp-2);
    font-family: var(--font-ui);
  }
  .btn {
    height: 32px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg-raised);
    color: var(--text-primary);
    font-weight: 500;
    margin-top: var(--sp-2);
  }
  .btn.primary {
    background: var(--accent-primary);
    color: var(--text-inverse);
    border-color: var(--accent-primary);
    font-weight: 600;
  }
  .err {
    background: var(--status-error);
    color: #fff;
    padding: var(--sp-2);
    border-radius: var(--radius-md);
    font-size: var(--fs-xs);
  }
  .hint {
    color: var(--text-muted);
    font-size: var(--fs-xs);
    text-align: center;
    margin: 0;
  }
  code {
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }
</style>
