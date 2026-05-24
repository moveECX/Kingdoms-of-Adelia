# Roadmap — Aldermark

> Phased, milestone-based. Each phase has explicit **acceptance criteria** (the bar for "done"). Pacing assumes the **heavy weekly time budget** chosen at bootstrap, so estimates are aggressive. Server is authoritative throughout (`ARCHITECTURE.md`).
>
> **Stack note overriding the original brief:** Phase 1 uses **PostgreSQL via Docker Compose**, *not* SQLite — PostgreSQL-everywhere is a locked decision (`ARCHITECTURE.md`). "No SQLite" applies from day one.

## Phase 1 — Solo Prototype  ·  ~1–2 weeks
One local city; the **build → produce → upgrade** loop with **working adjacency**. No combat, no networking beyond localhost, no other players.

**Acceptance criteria**
- `docker compose up -d db` + one command boots server + client locally.
- Found a city with fixed terrain nodes; place/upgrade/demolish buildings on the 9×9 grid via UI.
- Resources accrue **analytically** (rate × elapsed, capped) and the HUD interpolates smoothly; build/upgrade jobs complete on schedule via the server tick.
- **Adjacency multiplier is computed and visibly affects production** (Fandom model), with a preview before building.
- `shared/formulas` unit tests pass for adjacency, cost, production, build-time; `data/*.yaml` loads + validates.

→ **Concrete ticket list below.**

## Phase 2 — World Map & Monsters  ·  ~2–3 weeks
Multiple cities per account; a **world map** view; **PvE** combat against dungeon/monster spawns. Still single-player (no other accounts).

**Acceptance criteria**
- World map (Canvas) renders tiles/cities/dungeons with pan/zoom + viewport culling.
- Found additional cities (Marshal + cost + 7-day shield); per-account city cap by title.
- Train units; send **raids** to dungeons; deterministic combat resolves at arrival; loot returns and is credited (capped by carry).
- Dungeon completion + loot tables match `GAME-MECHANICS.md` §7.

## Phase 3 — Multiplayer Foundations  ·  ~2–3 weeks
**Auth, sessions, persistent shared world**, many accounts coexisting. **No PvP yet.**

**Acceptance criteria**
- Register/login (argon2id), session cookies, rate-limited endpoints (minimal — self-hosted).
- One persistent world; players see each other's cities on the map; WS region rooms deliver map deltas.
- Server survives restart with no state loss; scheduler resumes due events correctly.
- Chat (global + city) over WS.

## Phase 4 — PvP & Economy  ·  ~3–4 weeks
**Player-vs-player** combat, the **marketplace**, and **alliances**.

**Acceptance criteria**
- Citadel-gated attack types (scout/plunder/assault/siege/support); night protection; walls/towers/traps modifiers; combat reports to both sides.
- Marketplace listings + cart/ship transfers resolving on travel time.
- Alliances (≤100, ranks, diplomacy, alliance chat/forum, event log).

## Phase 5 — Endgame  ·  ~2–3 weeks
**Shrines, Palaces, victory conditions, leaderboards.**

**Acceptance criteria**
- Shrines activate; enlightenment lets castled alliance cities build/upgrade Palaces (1/enlightenment).
- Alliance **Faith** aggregates per virtue with the documented bonus; **owning a L10 Palace of all 8 virtues wins** and ends the world.
- Rankings/leaderboards (players + alliances) and a Champions record.

---

## Phase 1 — Ticket list (start here)

Tickets are vertical where possible. Definition of Done per `CLAUDE.md`. **Begin with #001.**

**#001 — Monorepo & toolchain bootstrap**
Set up npm workspaces (`server`/`client`/`shared`), `tsconfig.base.json` (strict, path aliases `@server/@client/@shared`), ESLint (`@typescript-eslint` strict) + Prettier, and root scripts (`dev`, `build`, `lint`, `test`, `typecheck`).
*AC:* `npm install` at root wires all workspaces; `npm run lint && npm run typecheck` pass on empty scaffolding; `@shared/*` imports resolve from both server and client.

**#002 — Local PostgreSQL via Docker Compose**
`docker-compose.yml` with `postgres:16-alpine`, named volume, env-driven creds; `.env.example`; README snippet.
*AC:* `docker compose up -d db` yields a reachable DB; documented `DATABASE_URL` connects.

**#003 — Kysely setup + first migration**
Wire Kysely + migration runner; migration `0001_core` creating `accounts`, `cities`, `city_tiles`, `city_buildings`, `build_queue`; generate `schema.sql`.
*AC:* `npm run migrate` is idempotent up/down; types generated; `schema.sql` matches.

**#004 — Shared data schemas + YAML loader**
Zod schemas for `buildings`/`units`/`resources`/`titles`; loader validates `data/*.yaml` at boot (array lengths = maxLevel, no dangling refs, no NaN).
*AC:* valid data loads; a deliberately broken file fails boot with a precise error; loader unit-tested.

**#005 — `data/buildings.yaml` + `data/resources.yaml` (Phase 1 subset)**
Transcribe the producer family, enhancers, Cottage, Hall, Warehouse from `GAME-MECHANICS.md` with confidence comments.
*AC:* values match the doc; schema-valid; covers every building needed for the Phase 1 loop.

**#006 — `shared/formulas`: cost, build-time, production**
Pure functions: `buildingCost(key,toLevel)`, `buildTimeSec(key,toLevel,constructionPct)`, `baseProduction(key,level)`. Deterministic.
*AC:* unit tests assert exact values from the doc (e.g. Hall L7 = 15,000 timber + 10,000 stone).

**#007 — `shared/formulas`: adjacency**
Implement the Fandom model `base×(1+Σnodes+Σcottages)×(1+enhancer)`, max-one-enhancer rule, lakes-for-farms.
*AC:* the worked example returns 1,522.5/h; counter-cases (2nd enhancer ignored) tested; model swappable for the daydull variant via a flag.

**#008 — City founding + fixed terrain generator**
Server logic to create a city: place Hall at center, generate `city_tiles` node layout from a seed (deterministic), seed starting resources/caps.
*AC:* founding a city writes tiles+Hall; same seed → same layout; starting state matches `cities` defaults.

**#009 — Analytic resource model + materialization**
`shared/formulas/resources.ts` deriving current amounts; server helpers to read (derive) and materialize (write-back on rate change/spend), clamped to cap.
*AC:* deriving after N hours equals expected capped value; spend/again-derive is consistent; tested.

**#010 — Build queue + scheduler tick**
1 s scheduler polling `build_queue.resolve_at<=now()`; on resolve: set/raise building level, mark `layout_dirty`, recompute adjacency + production for the city, materialize resources.
*AC:* a queued L1→L2 completes at the right time; production updates; late tick still resolves deterministically; covered by an integration test against a test DB.

**#011 — Adjacency recompute on layout change**
On place/upgrade/demolish, recompute `adjacency_pct` + `production_h` for affected slots; clear `layout_dirty`.
*AC:* adding a Sawmill next to two Woodcutters raises both their cached production to the formula's value.

**#012 — Fastify server + REST: build/upgrade/demolish/city**
`/api/v1` with auth stub (single dev account), `GET /cities/:id`, `POST build|upgrade|demolish`, `DELETE queue/:id`, `GET /data/manifest`. Zod-validated; integer money.
*AC:* a client can fetch a city and drive the full loop; invalid commands return typed 4xx; affordability/prereq/slot checks enforced server-side.

**#013 — WebSocket deltas**
`/ws` with `subscribe city:`, emitting `city.snapshot`, `city.delta`, `queue.resolved`, `resources.rate`.
*AC:* building in one tab updates another subscribed client within a tick without reload.

**#014 — Client shell + design tokens**
Svelte 5 + Vite app; `tokens.css` synced with `DESIGN-SYSTEM.md`; app shell (resource HUD, sidebar, main, context panel) matching `design-system.html`.
*AC:* shell renders dark/data-dense; HUD shows live resources with local interpolation; matches the demo's look.

**#015 — City grid view + build/upgrade UI**
Render the 9×9 grid from city state; click empty slot → building picker (with cost/time/output **preview** via `shared/formulas`); click built slot → context panel (upgrade/demolish); adjacency highlight on hover.
*AC:* full build→produce→upgrade loop is playable end-to-end against the server; previews match post-build reality.

**#016 — Dev seed + "play the prototype" script**
A `npm run seed` creating a dev account + one city with a believable terrain layout; documented one-command run.
*AC:* fresh clone → `docker compose up -d db && npm run migrate && npm run seed && npm run dev` → a playable single city in the browser.

*(16 tickets. Pull in order; #001–#003 are setup, #004–#011 are the engine, #012–#016 make it playable.)*
