# CLAUDE.md — Master Handoff

> **Read this first, every session.** It is the map; the other docs are the territory. Keep the **Active Context** section (bottom) current at the end of every session.

## Mission & scope
Aldermark is a browser-based, server-authoritative **MMO city-building strategy game** — a clean-room reimplementation of *Lord of Ultima* / *Crown of the Gods* gameplay with **entirely original** branding, theme (original-mythology medieval), art, and lore. The signature mechanic is **city-grid adjacency** optimization; the long game is alliance conquest and shrine/Palace victory. Target deployment is **self-hosted, single shared world**. We replicate mechanics and balance numbers (facts, not copyrightable) while inventing all expression — see `IP-COMPLIANCE.md`.

## Tech stack (detail in `ARCHITECTURE.md`)
- **TypeScript strict** on client + server + shared. No `any`; no `@ts-ignore` without a reason.
- **Client:** Svelte 5 (runes) + Vite; plain CSS + design tokens; city grid = CSS/SVG, world map = Canvas 2D.
- **Server:** Node + Fastify (REST) + `ws` (live deltas) + a 1 s **tick scheduler**; authoritative.
- **DB:** PostgreSQL 16 + Kysely (typed query builder + migrations). **No SQLite, ever.**
- **Shared:** Zod schemas (REST/WS/data contracts) + **pure formulas** (adjacency, cost, production, combat) used by the server for truth and the client for previews.

## Repository layout
```
CLAUDE.md ARCHITECTURE.md GAME-MECHANICS.md GAME-DATA-SCHEMA.md
DESIGN-SYSTEM.md ROADMAP.md IP-COMPLIANCE.md RESEARCH-LOG.md README.md
package.json tsconfig.base.json docker-compose.yml .env.example eslint.config.js
shared/   schemas/ constants/ types/ formulas/         # env-agnostic; no fs/window
server/   src/ db/{migrations,schema.sql} game/ routes/ ws/
client/   src/ public/ assets/ design-system.html      # ORIGINAL assets only
data/     buildings.yaml units.yaml resources.yaml titles.yaml README.md
research/ REPO-DECISION.md openlou-analysis.md lordofultima-felix-analysis.md
          wiki-snapshots/        (committed mirror)
          reference-repos/       (GITIGNORED — GPLv3 code + EA assets)
```

## Commands
| Task | Command |
|---|---|
| Start DB | `docker compose up -d db` |
| Install | `npm install` (root; wires all workspaces) |
| Migrate / seed | `npm run migrate` · `npm run seed` |
| Dev (server+client) | `npm run dev` |
| Typecheck / lint / format | `npm run typecheck` · `npm run lint` · `npm run format` |
| Test | `npm test` (Vitest) |

## Coding standards (full rationale in this section + `ARCHITECTURE.md`)
- **Strict TS**, no `any`; every escape hatch gets a comment explaining why.
- **Files < 300 lines** preferred, **hard cap 500** — split aggressively.
- **No barrel `index.ts`** re-export hubs that hide structure.
- **No premature abstraction** — no `Manager`/`Helper`/`Service`/`Util` classes without concrete need.
- **Test what matters**: formulas, combat, tick/scheduler resolution, schema validation. Skip UI minutiae.
- **Comments explain *why***, not what. Self-documenting code first.
- **Imports via path aliases** (`@shared/...`, `@server/...`, `@client/...`), not deep relatives.
- **Conventional commits**: `feat: fix: chore: docs: refactor: test:`.
- **Determinism**: all game math is pure functions of `(state, data, timestamps)` — reproducible, DB-free to test.

## Which doc covers what
| Need | Doc |
|---|---|
| Why a tech choice; tick loop; data flows | `ARCHITECTURE.md` |
| A formula / cost / unit stat / victory rule | `GAME-MECHANICS.md` (every value tagged `[V]`/`[A]`/`[U]`) |
| A table/column; API or WS message; data-file shape | `GAME-DATA-SCHEMA.md` |
| A color/spacing token or component | `DESIGN-SYSTEM.md` (+ `client/design-system.html`) |
| What to build next; acceptance criteria | `ROADMAP.md` |
| Can I use this name/asset? | `IP-COMPLIANCE.md` |
| Where did a number come from? | `RESEARCH-LOG.md` |
| Why not fork the OSS repos? | `research/REPO-DECISION.md` |

## Definition of Done (a feature)
1. Behavior matches `GAME-MECHANICS.md` (or the doc is updated + `RESEARCH-LOG.md` noted).
2. Server-authoritative; client cannot fabricate state (previews via `shared/formulas` only).
3. Inputs validated by shared zod schemas; errors are typed.
4. Tests for the logic that can be wrong (formulas/scheduler/validation) pass.
5. `npm run typecheck && npm run lint && npm test` clean; files within size limits.
6. Acceptance criteria of the relevant ROADMAP ticket met.

## Open questions for the user
- **Project name**: `Aldermark` is provisional (centralized in `shared/constants/`; renaming is a find/replace). Override anytime.
- **License**: TBD — recommend **MIT** (self-hosted) or **AGPLv3** (if ever public). Not yet chosen.
- **Rare resources / premium currency**: kept minimal/deferred for a self-hosted build; revisit at Phase 4–5.

---

## Active Context
**Last worked on (2026-05-24):** Bootstrap session — all planning docs written; both reference repos analyzed (build-fresh decision); LoU mechanics researched + the key Fandom pages mirrored to `research/wiki-snapshots/` (per-level building tables, adjacency, and the combat formula are `[verified]`); repo skeleton + workspace configs + `data/*.yaml` seeded; initial git commit made. **No gameplay code.**

**Next up → Phase 1, Ticket #001** (`ROADMAP.md`): *Monorepo & toolchain bootstrap* — `npm install` at root, confirm `@shared/*` resolves from server & client, `lint`/`typecheck` pass on the scaffolding. Then #002 (Docker Postgres) and #003 (Kysely + first migration).

**Watch-outs for the next session:**
- Implement the **Fandom adjacency model** (`base×(1+Σnodes+Σcottages)×(1+enhancer)`) behind tests; the daydull variant is a flagged alternative (`RESEARCH-LOG.md` open conflict #1).
- Fill `[U]` gaps (unit training times, some carry capacities) via the Fandom `?action=raw` + browser-UA trick that worked this session.
- Never trust OpenLoU's numbers over the Fandom wikitext (it has data bugs).
