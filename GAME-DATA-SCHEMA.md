# Game Data & Schema — Aldermark

> The canonical data model: **PostgreSQL schema**, **game-data file formats**, **REST + WebSocket contracts**, and **versioning**. Informed by — not copied from — OpenLoU's `db.sql` (see `research/openlou-analysis.md`). Single shared world ⇒ **no `world_id`** anywhere.
>
> Conventions: surrogate `bigint` PKs (`GENERATED ALWAYS AS IDENTITY`); coordinates carried as columns with **unique indexes** (improving on OpenLoU's composite natural keys); `timestamptz` everywhere; money/resources as `bigint` (integer units, no floats); `snake_case` columns; every FK `ON DELETE` is explicit. DDL below is **illustrative** — the source of truth is `server/db/migrations/` (Kysely), with a generated snapshot in `server/db/schema.sql`.

---

## 1. Design rules carried from mechanics → schema

1. **Resources are analytic, not ticked** (see `ARCHITECTURE.md` §4). Store `amount`, `rate_per_h`, `cap`, `as_of`; derive current value on read: `min(cap, amount + rate_per_h * hours(now − as_of))`. Materialize only on rate change/consumption.
2. **Adjacency is cached.** Each building slot stores its computed `adjacency_pct` + `production_per_h`; recompute only when the city's layout changes (a `layout_dirty` flag on `cities`).
3. **Everything timed is a timestamp row.** Build/training/movement completions are rows with `resolve_at`; the scheduler polls `WHERE resolve_at <= now()`.
4. **Game balance lives in `data/*.yaml`, not the DB.** The DB stores *instances* (this city's L7 Quarry); the YAML stores *rules* (a Quarry's cost/output per level). Buildings/units are referenced by stable string keys (e.g. `quarry`, `knight`), never by the numeric ids OpenLoU used.

---

## 2. Core schema (Phases 1–3)

### accounts
```sql
CREATE TABLE accounts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      varchar(24)  NOT NULL UNIQUE,
  email         citext       NOT NULL UNIQUE,
  password_hash text         NOT NULL,            -- argon2id; never plaintext (cf. OpenLoU)
  title         text         NOT NULL DEFAULT 'sir',  -- title key → max-cities (data/titles.yaml)
  gold          bigint       NOT NULL DEFAULT 0,   -- empire-wide, uncapped
  mana          integer      NOT NULL DEFAULT 0,
  rank_points   integer      NOT NULL DEFAULT 0,
  alliance_id   bigint       REFERENCES alliances(id) ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  last_seen_at  timestamptz
);
```

### cities  (one row per city; coordinate-unique on the single world map)
```sql
CREATE TABLE cities (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id    bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name          varchar(24) NOT NULL DEFAULT 'New City',
  x             integer NOT NULL,
  y             integer NOT NULL,
  -- analytic resource model (timber/stone/iron/grain); gold is on accounts
  timber        bigint NOT NULL DEFAULT 0,  timber_rate_h int NOT NULL DEFAULT 0,
  stone         bigint NOT NULL DEFAULT 0,  stone_rate_h  int NOT NULL DEFAULT 0,
  iron          bigint NOT NULL DEFAULT 0,  iron_rate_h   int NOT NULL DEFAULT 0,
  grain         bigint NOT NULL DEFAULT 0,  grain_rate_h  int NOT NULL DEFAULT 0,
  cap_timber    bigint NOT NULL DEFAULT 5000,  cap_stone bigint NOT NULL DEFAULT 5000,
  cap_iron      bigint NOT NULL DEFAULT 5000,  cap_grain bigint NOT NULL DEFAULT 5000,
  resources_as_of   timestamptz NOT NULL DEFAULT now(),
  construction_pct  integer NOT NULL DEFAULT 100,  -- 100 = ×1.0 build speed (cottages raise it)
  layout_dirty      boolean NOT NULL DEFAULT true, -- recompute adjacency when true
  protected_until   timestamptz,                   -- 7-day new-city shield
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (x, y)
);
CREATE INDEX cities_account_idx ON cities(account_id);
```

### city_tiles  (fixed terrain nodes inside a city, set at founding)
```sql
CREATE TABLE city_tiles (
  city_id   bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_x    smallint NOT NULL,        -- 0..8 (9×9 grid)
  slot_y    smallint NOT NULL,
  node_type text     NOT NULL,        -- 'wood'|'stone'|'iron'|'grain'|'lake'|'empty'
  PRIMARY KEY (city_id, slot_x, slot_y)
);
```

### city_buildings  (the construction grid; cached adjacency/production)
```sql
CREATE TABLE city_buildings (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id       bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_x        smallint NOT NULL,
  slot_y        smallint NOT NULL,
  building_key  text     NOT NULL,    -- 'quarry','sawmill',... → data/buildings.yaml
  level         smallint NOT NULL DEFAULT 1,
  adjacency_pct integer  NOT NULL DEFAULT 0,   -- cached multiplier (e.g. 190 = +190%)
  production_h  integer  NOT NULL DEFAULT 0,   -- cached per-hour output at this level+adjacency
  UNIQUE (city_id, slot_x, slot_y)
);
CREATE INDEX city_buildings_city_idx ON city_buildings(city_id);
```

### build_queue  (construction/upgrade jobs)
```sql
CREATE TABLE build_queue (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id      bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_x       smallint NOT NULL,
  slot_y       smallint NOT NULL,
  building_key text NOT NULL,
  to_level     smallint NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  resolve_at   timestamptz NOT NULL,
  ordinal      smallint NOT NULL          -- position in the city's queue
);
CREATE INDEX build_queue_due_idx ON build_queue(resolve_at);   -- scheduler hot path
```

### garrison  +  training_queue  (Phase 2+)
```sql
CREATE TABLE garrison (
  city_id   bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  unit_key  text   NOT NULL,          -- 'berserker','knight',... → data/units.yaml
  qty       bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (city_id, unit_key)
);
CREATE TABLE training_queue (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id    bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  unit_key   text NOT NULL,
  qty_total  integer NOT NULL,
  qty_done   integer NOT NULL DEFAULT 0,
  resolve_at timestamptz NOT NULL      -- completion of the next unit in the batch
);
CREATE INDEX training_due_idx ON training_queue(resolve_at);
```

### military_actions  (movements; Phase 2 PvE, Phase 4 PvP) + combat_reports
```sql
CREATE TABLE military_actions (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind          text NOT NULL,             -- 'raid'|'plunder'|'assault'|'siege'|'support'|'transport'|'return'
  origin_city   bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  target_x      integer NOT NULL,
  target_y      integer NOT NULL,
  troops        jsonb NOT NULL,            -- { unit_key: qty } (validated by shared zod schema)
  cargo         jsonb,                     -- resources carried (plunder/transport)
  depart_at     timestamptz NOT NULL,
  resolve_at    timestamptz NOT NULL,      -- arrival / battle time
  phase         text NOT NULL DEFAULT 'outbound'
);
CREATE INDEX mil_due_idx ON military_actions(resolve_at);

CREATE TABLE combat_reports (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attacker_id bigint REFERENCES accounts(id) ON DELETE SET NULL,
  defender_id bigint REFERENCES accounts(id) ON DELETE SET NULL,
  target_x    integer NOT NULL, target_y integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  detail      jsonb NOT NULL              -- inputs, losses %, survivors, loot — full reproducible record
);
```

### dungeons  (PvE map features; Phase 2)
```sql
CREATE TABLE dungeons (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  x             integer NOT NULL, y integer NOT NULL,
  dungeon_type  text NOT NULL,            -- 'forest'|'hill'|'mountain'|'sea'
  level         smallint NOT NULL,
  completion    smallint NOT NULL DEFAULT 0,  -- 0..100
  UNIQUE (x, y)
);
```

### alliances / alliance_members / market_listings / chat_messages
```sql
CREATE TABLE alliances (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(32) NOT NULL UNIQUE, tag varchar(6) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE alliance_members (
  alliance_id bigint NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  account_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  rank        text NOT NULL DEFAULT 'novice',   -- leader|second|officer|veteran|member|novice
  PRIMARY KEY (account_id)                       -- one alliance per account
);
CREATE TABLE market_listings (              -- Phase 4
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  offer_resource text NOT NULL, offer_qty bigint NOT NULL,
  price_gold bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
```

**Phase 5 (endgame):** `shrines(x,y,virtue,active_from,active_to)`, `palaces(city_id,virtue,level)`, `alliance_faith(alliance_id,virtue,faith)`. Deferred; listed so the model is anticipated.

---

## 3. Game-data file formats (`data/*.yaml`)

Balance lives in version-controlled YAML, validated at server boot by `shared/schemas`. Keys are stable strings. Values transcribed from `GAME-MECHANICS.md` (confidence-tagged there).

**`data/resources.yaml`**
```yaml
schemaVersion: 1
resources:
  timber: { kind: harvested, producer: woodcutter_lodge, enhancer: sawmill }
  stone:  { kind: harvested, producer: quarry,           enhancer: stonemason }
  iron:   { kind: harvested, producer: iron_mine,        enhancer: foundry }
  grain:  { kind: harvested, producer: farm,             enhancer: mill }
  gold:   { kind: pooled,    producer: townhouse,        capped: false }
adjacency:
  node_first_pct: 50
  node_additional_pct: 40
  model: additive_then_enhancer   # production = base*(1+nodes+cottages)*(1+enhancer)
```

**`data/buildings.yaml`** (excerpt — producer family)
```yaml
schemaVersion: 1
buildings:
  woodcutter_lodge:
    name: "Woodcutter's Lodge"          # LoU: Woodcutter's Hut
    category: producer
    produces: timber
    prereq: { hall: 1 }
    maxLevel: 10
    # index 0 = level 1 … index 9 = level 10
    output_h: [20,40,60,85,110,140,175,210,250,300]
    cost:    # [timber, stone] per level
      - [50,0]
      - [200,0]
      - [400,200]
      - [1400,600]
      - [3500,1500]
      - [6000,3000]
      - [10000,5000]
      - [16000,8000]
      - [25000,13000]
      - [38000,20000]
    buildTimeSec: [15,54,360,2700,6075,12150,22500,35820,53880,81720]
  sawmill:
    name: "Sawmill"
    category: enhancer
    boosts: woodcutter_lodge
    efficiency_pct: [30,35,40,45,50,55,60,65,70,75]
    storage_pct:    [20,40,60,80,100,120,140,160,180,200]
    prereq: { hall: 6 }
    maxLevel: 10
    cost: [[60,60],[150,150],[350,350],[1100,1100],[2700,2700],[5000,5000],[8500,8500],[13500,13500],[21500,21500],[33000,33000]]
```

**`data/units.yaml`** (excerpt)
```yaml
schemaVersion: 1
units:
  knight:
    name: Knight
    type: cavalry
    role: offensive
    attack: 90
    defense: { infantry: 40, cavalry: 30, magic: 20, artillery: 40 }  # confidence: approximate
    upkeepGrain: 25
    carry: 18
    trainer: { building: stable, level: 10 }
    cost: { timber: 0, stone: 0, iron: 250, gold: 100 }
combat:
  intensity: { assault: 0.5, scout: 0.5, boss: 0.5, plunder_defender: 0.01, default: 0.10 }
  wall_bonus_pct: [1,3,6,10,15,20,26,33,41,50]
```

Loader rejects unknown keys, NaNs, wrong array lengths (must equal `maxLevel`), and dangling references (e.g. an enhancer pointing at a non-existent producer).

---

## 4. API contract

REST base **`/api/v1`** (CRUD, hydration, history). WS at **`/ws`** (live deltas). All bodies validated by shared zod schemas; all monetary/resource values integers.

### REST (Phase 1 core)
| Method | Path | Body / Query → Response |
|---|---|---|
| `POST` | `/api/v1/auth/register` | `{username,email,password}` → `{accountId}` |
| `POST` | `/api/v1/auth/login` | `{username,password}` → `{token}` (httpOnly cookie) |
| `GET` | `/api/v1/me` | → account + city list summary |
| `GET` | `/api/v1/cities/:id` | → full city: tiles, buildings, derived resources, queue |
| `POST` | `/api/v1/cities/:id/build` | `{slotX,slotY,buildingKey}` → `{queued:BuildJob}` (start new building) |
| `POST` | `/api/v1/cities/:id/upgrade` | `{slotX,slotY}` → `{queued:BuildJob}` |
| `POST` | `/api/v1/cities/:id/demolish` | `{slotX,slotY}` → `{ok}` |
| `DELETE` | `/api/v1/cities/:id/queue/:jobId` | → `{ok}` (cancel; refund policy in formulas) |
| `GET` | `/api/v1/data/manifest` | → versions+hashes of loaded `data/*.yaml` (client preview parity) |

Phase 2+: `/cities/:id/train`, `/map?bbox=`, `/actions` (raid/plunder/attack), `/market/listings`, `/alliances/*`, `/reports/*`.

### WebSocket messages
Envelope `{ "t": <type>, "d": <payload> }`, validated by `shared/schemas/ws`.

**Server → client**
| `t` | payload | when |
|---|---|---|
| `city.snapshot` | full city state | on subscribe |
| `city.delta` | changed fields (resources/buildings/queue) | on any change |
| `queue.resolved` | `{cityId, slot, buildingKey, level}` | build completes |
| `resources.rate` | `{cityId, rates, asOf}` | production rate changes |
| `train.resolved` | `{cityId, unitKey, qty}` | training completes |
| `action.incoming` | `{from, kind, eta}` | enemy movement detected (Phase 4) |
| `combat.report` | report id + summary | battle resolved |
| `chat.msg` | `{scope, from, text, ts}` | chat |
| `error` | `{code, message}` | rejected command |

**Client → server**
| `t` | payload |
|---|---|
| `subscribe` | `{channel: 'city:'|'alliance:'|'region:', id}` |
| `unsubscribe` | `{channel}` |
| `chat.send` | `{scope, text}` |

> Authority rule: mutating actions go over **REST** (idempotency, validation, clear errors); the **WS** stream is read-mostly (deltas) + chat/subscriptions. The client may *preview* an action's cost/time/output with `shared/formulas` + the data manifest, but the server's response is canonical.

---

## 5. Versioning

- **Data files**: each carries `schemaVersion`. `/api/v1/data/manifest` exposes `{file, schemaVersion, sha256}` so the client refuses to render previews against a mismatched ruleset. Balance changes bump content; structural changes bump `schemaVersion` + a migration note in `RESEARCH-LOG.md`.
- **DB**: forward-only Kysely migrations in `server/db/migrations/NNNN_name.ts`; `schema.sql` regenerated after each. No destructive change without a migration.
- **API**: path-versioned (`/api/v1`). Breaking changes → `/api/v2`; WS envelope carries an implicit version tied to the REST version negotiated at connect.
