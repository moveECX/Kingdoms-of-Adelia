# Spieldaten & Schema — Kingdoms of Adelia

> Das kanonische Datenmodell: **PostgreSQL-Schema**, **Spieldaten-Dateiformate**, **REST- + WebSocket-Verträge** und **Versionierung**. Informiert von — nicht kopiert aus — OpenLoUs `db.sql` (siehe `research/openlou-analysis.md`). Eine gemeinsame Welt ⇒ **kein `world_id`** irgendwo.
>
> Konventionen: Surrogat-`bigint`-PKs (`GENERATED ALWAYS AS IDENTITY`); Koordinaten als Spalten mit **Unique-Indizes** (besser als OpenLoUs zusammengesetzte Natural Keys); überall `timestamptz`; Geld/Ressourcen als `bigint` (ganzzahlige Einheiten, keine Floats); `snake_case`-Spalten; jedes FK-`ON DELETE` explizit. DDL unten ist **illustrativ** — die Quelle der Wahrheit ist `server/db/migrations/` (Kysely), mit einem generierten Snapshot in `server/db/schema.sql`.

---

## 1. Design-Regeln Mechanik → Schema

1. **Ressourcen sind analytisch, nicht getickt** (siehe `ARCHITECTURE.md` §4). Speichere `amount`, `rate_per_h`, `cap`, `as_of`; leite den aktuellen Wert beim Lesen ab: `min(cap, amount + rate_per_h * hours(now − as_of))`. Materialisiere nur bei Ratenänderung/Verbrauch.
2. **Adjazenz wird gecacht.** Jeder Bau-Slot speichert seinen berechneten `adjacency_pct` + `production_per_h`; Neuberechnung nur, wenn sich das Layout der Stadt ändert (ein `layout_dirty`-Flag auf `cities`).
3. **Alles Zeitgesteuerte ist eine Zeitstempel-Zeile.** Bau-/Trainings-/Bewegungs-Abschlüsse sind Zeilen mit `resolve_at`; der Scheduler pollt `WHERE resolve_at <= now()`.
4. **Spiel-Balance lebt in `data/*.yaml`, nicht in der DB.** Die DB speichert *Instanzen* (die L7-Quarry dieser Stadt); das YAML die *Regeln* (Kosten/Output einer Quarry pro Stufe). Gebäude/Einheiten werden über stabile String-Keys referenziert (`quarry`, `knight`), nie über die numerischen IDs, die OpenLoU nutzte.

---

## 2. Kern-Schema (Phasen 1–3)

### accounts
```sql
CREATE TABLE accounts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      varchar(24)  NOT NULL UNIQUE,
  email         citext       NOT NULL UNIQUE,
  password_hash text         NOT NULL,            -- argon2id; nie Klartext (vgl. OpenLoU)
  title         text         NOT NULL DEFAULT 'sir',  -- Titel-Key → max-Städte (data/titles.yaml)
  gold          bigint       NOT NULL DEFAULT 0,   -- reichsweit, ungedeckelt
  mana          integer      NOT NULL DEFAULT 0,
  rank_points   integer      NOT NULL DEFAULT 0,
  alliance_id   bigint       REFERENCES alliances(id) ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  last_seen_at  timestamptz
);
```

### cities  (eine Zeile pro Stadt; koordinaten-unique auf der einen Weltkarte)
```sql
CREATE TABLE cities (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id    bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name          varchar(24) NOT NULL DEFAULT 'New City',
  x             integer NOT NULL,
  y             integer NOT NULL,
  -- analytisches Ressourcenmodell (timber/stone/iron/grain); gold liegt auf accounts
  timber        bigint NOT NULL DEFAULT 0,  timber_rate_h int NOT NULL DEFAULT 0,
  stone         bigint NOT NULL DEFAULT 0,  stone_rate_h  int NOT NULL DEFAULT 0,
  iron          bigint NOT NULL DEFAULT 0,  iron_rate_h   int NOT NULL DEFAULT 0,
  grain         bigint NOT NULL DEFAULT 0,  grain_rate_h  int NOT NULL DEFAULT 0,
  cap_timber    bigint NOT NULL DEFAULT 5000,  cap_stone bigint NOT NULL DEFAULT 5000,
  cap_iron      bigint NOT NULL DEFAULT 5000,  cap_grain bigint NOT NULL DEFAULT 5000,
  resources_as_of   timestamptz NOT NULL DEFAULT now(),
  construction_pct  integer NOT NULL DEFAULT 100,  -- 100 = ×1.0 Bautempo (Cottages erhöhen es)
  layout_dirty      boolean NOT NULL DEFAULT true, -- Adjazenz neu berechnen, wenn true
  protected_until   timestamptz,                   -- 7-Tage-Neustadt-Schild
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (x, y)
);
CREATE INDEX cities_account_idx ON cities(account_id);
```

### city_tiles  (fixes Terrain in einer Stadt, bei Gründung gesetzt)
```sql
CREATE TABLE city_tiles (
  city_id   bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_x    smallint NOT NULL,        -- 0..8 (9×9-Raster)
  slot_y    smallint NOT NULL,
  node_type text     NOT NULL,        -- 'wood'|'stone'|'iron'|'grain'|'lake'|'empty'
  PRIMARY KEY (city_id, slot_x, slot_y)
);
```

### city_buildings  (das Bauraster; gecachte Adjazenz/Produktion)
```sql
CREATE TABLE city_buildings (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id       bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  slot_x        smallint NOT NULL,
  slot_y        smallint NOT NULL,
  building_key  text     NOT NULL,    -- 'quarry','sawmill',... → data/buildings.yaml
  level         smallint NOT NULL DEFAULT 1,
  adjacency_pct integer  NOT NULL DEFAULT 0,   -- gecachter Multiplikator (z. B. 190 = +190%)
  production_h  integer  NOT NULL DEFAULT 0,   -- gecachter Output/h bei Stufe+Adjazenz
  UNIQUE (city_id, slot_x, slot_y)
);
CREATE INDEX city_buildings_city_idx ON city_buildings(city_id);
```

### build_queue  (Bau-/Ausbau-Jobs)
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
  ordinal      smallint NOT NULL          -- Position in der Stadt-Queue
);
CREATE INDEX build_queue_due_idx ON build_queue(resolve_at);   -- Scheduler-Hot-Path
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
  resolve_at timestamptz NOT NULL      -- Abschluss der nächsten Einheit im Batch
);
CREATE INDEX training_due_idx ON training_queue(resolve_at);
```

### military_actions  (Bewegungen; Phase 2 PvE, Phase 4 PvP) + combat_reports
```sql
CREATE TABLE military_actions (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind          text NOT NULL,             -- 'raid'|'plunder'|'assault'|'siege'|'support'|'transport'|'return'
  origin_city   bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  target_x      integer NOT NULL,
  target_y      integer NOT NULL,
  troops        jsonb NOT NULL,            -- { unit_key: qty } (per geteiltem zod-Schema validiert)
  cargo         jsonb,                     -- transportierte Ressourcen (Plünderung/Transport)
  depart_at     timestamptz NOT NULL,
  resolve_at    timestamptz NOT NULL,      -- Ankunft / Kampfzeit
  phase         text NOT NULL DEFAULT 'outbound'
);
CREATE INDEX mil_due_idx ON military_actions(resolve_at);

CREATE TABLE combat_reports (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attacker_id bigint REFERENCES accounts(id) ON DELETE SET NULL,
  defender_id bigint REFERENCES accounts(id) ON DELETE SET NULL,
  target_x    integer NOT NULL, target_y integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  detail      jsonb NOT NULL              -- Inputs, Verlust-%, Überlebende, Loot — vollständiger, reproduzierbarer Datensatz
);
```

### dungeons  (PvE-Kartenobjekte; Phase 2)
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
  PRIMARY KEY (account_id)                       -- eine Allianz pro Account
);
CREATE TABLE market_listings (              -- Phase 4
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_id bigint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  offer_resource text NOT NULL, offer_qty bigint NOT NULL,
  price_gold bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
```

**Phase 5 (Endgame):** `shrines(x,y,virtue,active_from,active_to)`, `palaces(city_id,virtue,level)`, `alliance_faith(alliance_id,virtue,faith)`. Zurückgestellt; gelistet, damit das Modell vorgedacht ist.

---

## 3. Spieldaten-Dateiformate (`data/*.yaml`)

Balance lebt als versionierte YAML, getrennt von Code und Datenbank. Der Server lädt und **validiert** diese beim Boot gegen Zod-Schemas in `@adelia/shared`; die DB speichert nur *Instanzen*, nie die Regeln. Keys sind stabile Strings. Werte aus `GAME-MECHANICS.md` (dort confidence-getaggt) übernommen.

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

**`data/buildings.yaml`** (Auszug — Produzenten-Familie)
```yaml
schemaVersion: 1
buildings:
  woodcutter_lodge:
    name: "Woodcutter's Lodge"          # LoU: Woodcutter's Hut
    category: producer
    produces: timber
    prereq: { hall: 1 }
    maxLevel: 10
    # Index 0 = Stufe 1 … Index 9 = Stufe 10
    output_h: [20,40,60,85,110,140,175,210,250,300]
    cost:    # [timber, stone] pro Stufe
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

**`data/units.yaml`** (Auszug)
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

Der Loader weist unbekannte Keys, NaNs, falsche Array-Längen (müssen `maxLevel` entsprechen) und hängende Referenzen (z. B. ein Verstärker, der auf einen nicht existierenden Produzenten zeigt) zurück.

---

## 4. API-Vertrag

REST-Basis **`/api/v1`** (CRUD, Hydration, Historie). WS unter **`/ws`** (Live-Deltas). Alle Bodies durch geteilte Zod-Schemas validiert; alle Geld-/Ressourcenwerte ganzzahlig.

### REST (Phase-1-Kern)
| Methode | Pfad | Body / Query → Response |
|---|---|---|
| `POST` | `/api/v1/auth/register` | `{username,email,password}` → `{accountId}` |
| `POST` | `/api/v1/auth/login` | `{username,password}` → `{token}` (httpOnly-Cookie) |
| `GET` | `/api/v1/me` | → Account + Städte-Zusammenfassung |
| `GET` | `/api/v1/cities/:id` | → vollständige Stadt: Tiles, Gebäude, abgeleitete Ressourcen, Queue |
| `POST` | `/api/v1/cities/:id/build` | `{slotX,slotY,buildingKey}` → `{queued:BuildJob}` (neues Gebäude starten) |
| `POST` | `/api/v1/cities/:id/upgrade` | `{slotX,slotY}` → `{queued:BuildJob}` |
| `POST` | `/api/v1/cities/:id/demolish` | `{slotX,slotY}` → `{ok}` |
| `DELETE` | `/api/v1/cities/:id/queue/:jobId` | → `{ok}` (abbrechen; Erstattungsregel in Formeln) |
| `GET` | `/api/v1/data/manifest` | → Versionen+Hashes der geladenen `data/*.yaml` (Vorschau-Parität im Client) |

Phase 2+: `/cities/:id/train`, `/map?bbox=`, `/actions` (raid/plunder/attack), `/market/listings`, `/alliances/*`, `/reports/*`.

### WebSocket-Nachrichten
Envelope `{ "t": <type>, "d": <payload> }`, validiert durch `shared/schemas/ws`.

**Server → Client**
| `t` | Payload | wann |
|---|---|---|
| `city.snapshot` | voller Stadt-Zustand | beim Abonnieren |
| `city.delta` | geänderte Felder (Ressourcen/Gebäude/Queue) | bei jeder Änderung |
| `queue.resolved` | `{cityId, slot, buildingKey, level}` | Bau abgeschlossen |
| `resources.rate` | `{cityId, rates, asOf}` | Produktionsrate ändert sich |
| `train.resolved` | `{cityId, unitKey, qty}` | Training abgeschlossen |
| `action.incoming` | `{from, kind, eta}` | feindliche Bewegung erkannt (Phase 4) |
| `combat.report` | Report-ID + Zusammenfassung | Kampf aufgelöst |
| `chat.msg` | `{scope, from, text, ts}` | Chat |
| `error` | `{code, message}` | abgewiesener Befehl |

**Client → Server**
| `t` | Payload |
|---|---|
| `subscribe` | `{channel: 'city:'|'alliance:'|'region:', id}` |
| `unsubscribe` | `{channel}` |
| `chat.send` | `{scope, text}` |

> Autoritäts-Regel: mutierende Aktionen über **REST** (Idempotenz, Validierung, klare Fehler); der **WS**-Stream ist lese-lastig (Deltas) + Chat/Subscriptions. Der Client darf Kosten/Zeit/Output einer Aktion mit `shared/formulas` + dem Daten-Manifest *vorschauen*, aber die Server-Antwort ist kanonisch.

---

## 5. Versionierung

- **Datendateien**: jede trägt `schemaVersion`. `/api/v1/data/manifest` liefert `{file, schemaVersion, sha256}`, sodass der Client Vorschauen gegen ein nicht passendes Regelwerk verweigert. Balance-Änderungen ändern den Inhalt; strukturelle Änderungen erhöhen `schemaVersion` + eine Migrations-Notiz in `RESEARCH-LOG.md`.
- **DB**: vorwärts-gerichtete Kysely-Migrationen in `server/db/migrations/NNNN_name.ts`; `schema.sql` nach jeder neu generiert. Keine destruktive Änderung ohne Migration.
- **API**: pfad-versioniert (`/api/v1`). Breaking Changes → `/api/v2`; das WS-Envelope trägt eine implizite Version, gekoppelt an die beim Connect ausgehandelte REST-Version.
