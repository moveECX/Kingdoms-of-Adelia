# Repository Decision — Build Fresh vs. Fork

> Decision date: 2026-05-24. Status: **DECIDED — build fresh in TypeScript.**

## Decision

**Build a clean-room implementation from scratch in TypeScript.** Use the two reference repos and the community wikis as **references for mechanics, balance numbers, and schema shape only** — transcribing facts (which are not copyrightable), never copying code or assets.

## Options considered

### Option A — Fork `OpenLoU` (Go + PostgreSQL)
- ➖ **Language mismatch:** Go, but our locked stack is TypeScript on client + server (`ARCHITECTURE.md`). A fork means abandoning our stack or rewriting anyway.
- ➖ **GPLv3 copyleft:** deriving from its code forces our whole project to GPLv3. We want to license a self-hosted project on our own terms.
- ➖ **Immature:** "nothing really works yet"; only scaffolding, one unit, no tick loop, buggy data.
- ➕ Genuinely useful **PostgreSQL schema** and **externalized JSON building data**.

### Option B — Fork `FelixLeChat/LordOfUltima` (C#/.NET WPF)
- ➖ **Wrong platform:** Windows desktop app, not a browser MMO.
- ➖ **Wrong language:** C#.
- ➖ **No license → all rights reserved:** legally cannot reuse the code.
- ➖ **IP hazard:** 30 MB of EA-owned ripped assets.
- ➕ Confirms the building set and that LoU had research + dungeon/boss PvE.

### Option C — Build fresh in TypeScript ✅ (CHOSEN)
- ➕ Matches the locked stack (TS strict, Vite client, Node/Postgres server) end-to-end.
- ➕ No license entanglement; we choose our own license.
- ➕ Server-authoritative tick loop and websocket design tailored to our needs from day one.
- ➕ Lets us model the data cleanly (typed shared schemas) instead of inheriting buggy data.
- ➖ More upfront work — mitigated by the heavy weekly time budget and the rich reference material we *can* legally use.

## What "reference only" means (the legal line)

| Allowed ✅ | Not allowed ❌ |
|---|---|
| Reading & transcribing **numeric values** (costs, production curves, level caps) — these are facts | Copying OpenLoU `.go`/`.json` files or FelixLeChat `.cs` files verbatim |
| Replicating **game mechanics & formulas** (adjacency, combat) — mechanics aren't copyrightable | Reproducing creative **prose** (tooltip/lore text) word-for-word |
| Learning from **schema shape** and re-deriving our own | Pulling in GPLv3 code (would relicense us) |
| Confirming the **building/unit roster** | Using **any art/audio asset** from FelixLeChat (EA-owned) |

All transcribed values are tagged `[verified]` / `[approximate]` / `[unknown]` in `GAME-MECHANICS.md`, with OpenLoU-sourced numbers explicitly marked as such and cross-checked against the wikis.

## Consequences

- Reference repos live under `research/reference-repos/` and are **gitignored** (keeps EA assets and GPLv3 code out of our history).
- Our schema is defined freshly in `GAME-DATA-SCHEMA.md`, informed by — not copied from — OpenLoU's `db.sql`.
- Our balance data lives in original `data/*.yaml` files (`GAME-DATA-SCHEMA.md`), seeded with wiki-verified numbers.
- Project license: **TBD by the user** (recommend MIT for a self-hosted project, or AGPL if we want to keep any future public deployment open). Tracked in `CLAUDE.md` open questions.
