# Reference Analysis — OpenLoU (`joaopedrosgs/OpenLoU`)

> Analyzed 2026-05-24. Local clone: `research/reference-repos/OpenLoU-master/` (gitignored).
> Upstream: https://github.com/joaopedrosgs/OpenLoU — branches `master` and `loucore`.

## Summary verdict

A **Go + PostgreSQL** server-side reimplementation of Lord of Ultima, **GPLv3-licensed**, self-described as *"early state, nothing really works yet."* Wrong language for our TypeScript stack and copyleft-encumbered, so **not a fork candidate**. However, its **SQL schema and JSON building data are the single most useful reference we have** for our own (clean-room, re-derived) data model and balance numbers. See `REPO-DECISION.md`.

## License

- **GNU GPL v3** (full text in repo `LICENSE`, 35 KB). Strong copyleft.
- Implication: copying or creating a derivative work of OpenLoU's **code** would force our entire project under GPLv3. We do **not** want that for a self-hosted project we intend to license on our own terms.
- **Numeric game values (costs, production rates, level curves) are facts and not copyrightable.** We may read them, verify them against the wikis, and transcribe the *values* into our own original data files. We will **not** copy OpenLoU source files or their JSON files verbatim.

## Completeness

- README: *"The project is in early state, nothing really works yet."* Travis CI badge (defunct).
- Backend scaffolding exists (account/city/map servers, websocket hub, session) but no working game loop.
- Only **one unit** is defined (`City Guard`); no combat, no tick loop, no migrations framework (single `db.sql`).
- **Data bugs observed** (treat all OpenLoU numbers as `[approximate]` pending wiki verification):
  - `citywall.json` and `workshop.json` **both use `id: 28`**.
  - `quarry.json` labels its stone output `"ironh"` (copy-paste error).
  - `cityguard.json` `requires` `constructionId 16`, but id 16 is the **Sawmill**, not the City Guard House (id 19).
  - Production/enhancer buildings declare `"shared": "prod"`/`"inc"` but **no shared cost table exists** in the Go code — those costs are simply unimplemented.

## Tech stack

| Layer | Choice |
|---|---|
| Language | Go (70 `.go` files) |
| DB | PostgreSQL (`db.sql`), `sqlboiler` for model codegen (`sqlboiler.toml`) |
| Config | `config.toml` |
| Layout | Service-oriented: `accountserver/`, `cityserver/`, `mapserver/`, `hub/` (websocket), `session/`, `communication/`, `ent/`, `modules/` (game data), `app/`, `server/` |
| Entry | `main.go` (527 B — minimal) |

**Takeaway for us:** the *service decomposition* (separate concerns for accounts, city state, map, and a websocket hub) is a reasonable mental model, but at our self-hosted scale we will collapse it into a single Node process with internal modules (see `ARCHITECTURE.md`).

## Data model (`db.sql`) — the valuable part

Single-world, coordinate-keyed model. Reproduced here as **reference** (we re-derive our own schema in `GAME-DATA-SCHEMA.md`):

| Table | Key | Notable columns | Interpretation |
|---|---|---|---|
| `users` | `name` | `email`, `password`, `gold`, `diamonds`, `darkwood`, `runestone`, `veritium`, `trueseed`, `rank`, `alliance_name`, `alliance_rank` | Gold + premium currency (`diamonds`) + 4 **rare resources** held at account level. |
| `alliances` | `id` (serial) | `name` | Minimal. |
| `cities` | **`(x, y)`** | `user_name`, `city_name`, `points`, `{wood,stone,iron,food,gold}_production`, `{wood,stone,iron,food}_stored`, `{...}_limit`, `queue_time`, `construction_speed` | City addressed by **world coordinates**; resources + caps stored per city; gold has production but is pooled on the user. |
| `constructions` | **`(city_x, city_y, x, y)`** | `level`, `type`, `production`, `modifier`, `need_refresh` | Per-city building grid; each slot has a building `type`, a `level`, a cached `production`, an adjacency **`modifier`**, and a dirty flag (`need_refresh`) to recompute production lazily. |
| `queue` | `(construction_x, construction_y, city_x, city_y)` | `completion` (timestamp), `action` | Build/upgrade queue keyed to a construction slot, resolved by wall-clock `completion`. |
| `dungeons` | `(x, y)` | `type`, `level`, `progress` | PvE camps on the world map. |
| `military_actions` | `id` | `origin_id`, `target_id`, `arrival` (timestamp), `troops` (`json`) | Troop movements resolved at `arrival`; troop composition stored as JSON blob. |

**Design lessons we adopt:**
- Cities keyed by world coordinates → confirms a **single shared world** with no `world_id` (matches our scope decision).
- A per-slot **`modifier`** column = precomputed adjacency multiplier, with a `need_refresh` flag → adjacency is expensive, so **cache it and recompute on change**, not every tick.
- **Timestamp-driven scheduling** (`queue.completion`, `military_actions.arrival`) rather than counting ticks → the tick loop just polls for "due" rows. We adopt this (see `ARCHITECTURE.md` tick design).

**Design lessons we reject / improve:**
- `password` as plain `varchar(100)` with no hashing note → we hash (argon2/bcrypt).
- Composite natural keys everywhere → we prefer surrogate `bigint`/`uuid` PKs with coordinate **unique indexes**.
- JSON troop blobs in a relational column → acceptable for in-flight armies, but we'll type them with shared zod schemas.

## Building data (`modules/constructions/*.json`) — 25 buildings

Schema per file: `{ id, name, info, bonus[{name, value[]}], adjascent[{builds[], bonus[]}], resourceCost[[wood,stone]...], score[] }`. The values give us a **concrete balance reference**; full extraction lives in `GAME-MECHANICS.md` (flagged `[approximate]` / OpenLoU-sourced). Highlights:

- **Producers** (`Woodcutter's Hut`, `Quarry`, `Farm`, `Iron mine`): output per level e.g. wood `[5,10,15,20,30,45,75,120,200,300]/h`; costs not implemented in OpenLoU.
- **Enhancers** (`Sawmill`, `Stonemason`, `Foundry`, `Mill`): grant adjacency `+[30,35,…,75]%` to their matching producer, plus storage bonus to adjacent storage.
- **Cottage**: `+constructionspeed` and adjacency `+[3,6,…,30]%` to bordering producers.
- **Townhall**: base storage `[5000…175000]` + base wood `300`; one per city; max-building cap.
- **Warehouse**: storage `[2500…200000]`; enhanced by bordering Sawmill/Stonemason/Mill/Foundry.
- Military trainers (`Barracks`, `Training Ground`, `Stable`, `Workshop`, `Shipyard`, `City Guard House`) + caster/blessed buildings + `Castle` (army size + command-queue slots) + `City Wall` (`combatBonus [1,3,…,50]`).

⚠️ **IP flag:** two buildings carry Ultima proper nouns — **"Moonglow Tower"** (casters) and **"Trinsic Temple"** (blessed units/Barons). These names are recorded in our rename map and **must not** appear in our project (see `IP-COMPLIANCE.md`).

## What we reuse (as reference only, re-derived)

1. **Schema shape** → informs `GAME-DATA-SCHEMA.md` (timestamp-driven queues, cached adjacency modifier, coordinate-keyed cities).
2. **Building roster + per-level numbers** → seed values for `data/buildings.yaml`, cross-checked against the wikis and tagged for confidence.
3. **Adjacency relationships** (which enhancer boosts which producer; cottage→producers) → confirms the wiki mechanics.

## What we do NOT take

- No Go source, no `sqlboiler` models, no verbatim JSON files (avoids GPLv3 derivative status).
- No assumption that OpenLoU's numbers are correct — they are buggy and incomplete; the wikis are the authority.
