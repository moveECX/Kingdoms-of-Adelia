# Aldermark

A browser-based **MMO city-building strategy game** — original IP, in the gameplay lineage of *Lord of Ultima* and *Crown of the Gods* (both long out of service). Lay out a city to exploit **adjacency** bonuses, grow a frontier realm, raid ruins, trade, and contest ancient shrines with your alliance.

> **Status:** Planning & research **bootstrap complete** (2026-05-24). No gameplay code yet — implementation starts at **Phase 1, Ticket #001** (`ROADMAP.md`). *"Aldermark"* is a provisional working title.

## Tech stack
TypeScript (strict) everywhere · **Svelte 5 + Vite** client · **Fastify + `ws`** server with an authoritative tick scheduler · **PostgreSQL 16 + Kysely** · **Zod** shared schemas/formulas. Full rationale in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Quick start
> Wired up by ROADMAP tickets #001–#003; until then this is the intended flow.
```bash
cp .env.example .env
docker compose up -d db      # PostgreSQL 16 in a container
npm install                  # installs all workspaces (shared/server/client)
npm run migrate              # create schema
npm run seed                 # dev account + one starter city
npm run dev                  # server (:3000) + client (:5173)
```

## Documentation
Start with **[`CLAUDE.md`](./CLAUDE.md)** — the master handoff (mission, layout, commands, what's next).

| Doc | Covers |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Stack, module boundaries, tick loop, data flows |
| [`GAME-MECHANICS.md`](./GAME-MECHANICS.md) | Resources, adjacency, buildings, units, combat, victory |
| [`GAME-DATA-SCHEMA.md`](./GAME-DATA-SCHEMA.md) | DB schema, `data/*.yaml`, REST + WS contracts |
| [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) | Dark, data-dense UI tokens + components (+ `client/design-system.html`) |
| [`ROADMAP.md`](./ROADMAP.md) | 5 phases + the Phase 1 ticket list |
| [`IP-COMPLIANCE.md`](./IP-COMPLIANCE.md) | Legal boundaries, rename map, asset rules |
| [`RESEARCH-LOG.md`](./RESEARCH-LOG.md) | Dated findings; confirmed vs. open |

## License & IP
Project license **TBD** (see `CLAUDE.md`). This is a clean-room reimplementation of game *mechanics* (not copyrightable) with **entirely original** names, art, and lore. No assets or code from the reference projects are used. See [`IP-COMPLIANCE.md`](./IP-COMPLIANCE.md).
