# Referenz-Analyse — OpenLoU (`joaopedrosgs/OpenLoU`)

> Analysiert 2026-05-24. Lokaler Clone: `research/reference-repos/OpenLoU-master/` (gitignored).
> Upstream: https://github.com/joaopedrosgs/OpenLoU — Branches `master` und `loucore`.

## Kurz-Urteil

Eine **Go + PostgreSQL**-Server-Reimplementierung von Lord of Ultima, **GPLv3-lizenziert**, vom Autor als *„früher Zustand, nichts funktioniert wirklich"* beschrieben. Falsche Sprache für unseren TypeScript-Stack und copyleft-belastet, daher **kein Fork-Kandidat**. Allerdings sind sein **SQL-Schema und seine JSON-Gebäudedaten die nützlichste Referenz, die wir haben** für unser eigenes (clean-room, neu abgeleitetes) Datenmodell und die Balance-Zahlen. Siehe `REPO-DECISION.md`.

## Lizenz

- **GNU GPL v3** (Volltext im Repo `LICENSE`, 35 KB). Starkes Copyleft.
- Folge: Kopieren oder Ableiten von OpenLoU-**Code** würde unser ganzes Projekt unter GPLv3 zwingen. Wir wählen für unser Projekt bewusst **AGPL-3.0** (siehe `IP-COMPLIANCE.md`) und leiten daher nichts aus dem OpenLoU-Code ab.
- **Numerische Spielwerte (Kosten, Produktionsraten, Stufenkurven) sind Fakten und nicht schützbar.** Wir dürfen sie lesen, gegen die Wikis verifizieren und die *Werte* in unsere eigenen Datendateien transkribieren. Wir kopieren **keine** OpenLoU-Quelldateien oder deren JSON wörtlich.

## Vollständigkeit

- README: *„The project is in early state, nothing really works yet."* Travis-CI-Badge (defunkt).
- Backend-Gerüst existiert (account/city/map-Server, Websocket-Hub, Session), aber keine funktionierende Spielschleife.
- Nur **eine Einheit** definiert (`City Guard`); kein Kampf, kein Tick-Loop, kein Migrations-Framework (einzelnes `db.sql`).
- **Beobachtete Datenfehler** (alle OpenLoU-Zahlen als `[approximate]` behandeln bis zur Wiki-Verifikation):
  - `citywall.json` und `workshop.json` nutzen **beide `id: 28`**.
  - `quarry.json` beschriftet seinen Stein-Output als `"ironh"` (Copy-Paste-Fehler).
  - `cityguard.json` `requires` `constructionId 16`, aber id 16 ist die **Sawmill**, nicht das City Guard House (id 19).
  - Produzenten/Verstärker deklarieren `"shared": "prod"`/`"inc"`, aber **keine geteilte Kostentabelle** existiert im Go-Code — diese Kosten sind schlicht nicht implementiert.

## Tech-Stack

| Schicht | Wahl |
|---|---|
| Sprache | Go (70 `.go`-Dateien) |
| DB | PostgreSQL (`db.sql`), `sqlboiler` für Modell-Codegen (`sqlboiler.toml`) |
| Config | `config.toml` |
| Aufbau | Service-orientiert: `accountserver/`, `cityserver/`, `mapserver/`, `hub/` (Websocket), `session/`, `communication/`, `ent/`, `modules/` (Spieldaten), `app/`, `server/` |
| Entry | `main.go` (527 B — minimal) |

**Erkenntnis für uns:** die *Service-Zerlegung* (getrennte Belange für Accounts, Stadt-Zustand, Karte und ein Websocket-Hub) ist ein vernünftiges Mentalmodell, aber in unserer Selbsthosting-Größe kollabieren wir es in einen Node-Prozess mit internen Modulen (siehe `ARCHITECTURE.md`).

## Datenmodell (`db.sql`) — der wertvolle Teil

Single-World-, koordinaten-basiertes Modell. Hier als **Referenz** wiedergegeben (wir leiten unser eigenes Schema in `GAME-DATA-SCHEMA.md` neu ab):

| Tabelle | Key | Bemerkenswerte Spalten | Interpretation |
|---|---|---|---|
| `users` | `name` | `email`, `password`, `gold`, `diamonds`, `darkwood`, `runestone`, `veritium`, `trueseed`, `rank`, `alliance_name`, `alliance_rank` | Gold + Premiumwährung (`diamonds`) + 4 **seltene Ressourcen** auf Account-Ebene. |
| `alliances` | `id` (serial) | `name` | Minimal. |
| `cities` | **`(x, y)`** | `user_name`, `city_name`, `points`, `{wood,stone,iron,food,gold}_production`, `{wood,stone,iron,food}_stored`, `{...}_limit`, `queue_time`, `construction_speed` | Stadt über **Weltkoordinaten** adressiert; Ressourcen + Caps pro Stadt; Gold hat Produktion, ist aber auf dem User gepoolt. |
| `constructions` | **`(city_x, city_y, x, y)`** | `level`, `type`, `production`, `modifier`, `need_refresh` | Bauraster pro Stadt; jeder Slot hat einen `type`, ein `level`, eine gecachte `production`, einen Adjazenz-**`modifier`** und ein Dirty-Flag (`need_refresh`) zur faulen Neuberechnung. |
| `queue` | `(construction_x, construction_y, city_x, city_y)` | `completion` (Zeitstempel), `action` | Bau-/Ausbau-Queue an einen Slot gebunden, per Wanduhr-`completion` aufgelöst. |
| `dungeons` | `(x, y)` | `type`, `level`, `progress` | PvE-Camps auf der Weltkarte. |
| `military_actions` | `id` | `origin_id`, `target_id`, `arrival` (Zeitstempel), `troops` (`json`) | Truppenbewegungen, bei `arrival` aufgelöst; Truppen-Zusammensetzung als JSON-Blob. |

**Design-Lehren, die wir übernehmen:**
- Städte über Weltkoordinaten → bestätigt eine **gemeinsame Welt** ohne `world_id` (passt zu unserer Umfang-Entscheidung).
- Eine `modifier`-Spalte pro Slot = vorberechneter Adjazenz-Multiplikator mit `need_refresh`-Flag → Adjazenz ist teuer, also **cachen und bei Änderung neu berechnen**, nicht pro Tick.
- **Zeitstempel-getriebenes Scheduling** (`queue.completion`, `military_actions.arrival`) statt Tick-Zählen → der Tick-Loop pollt nur „fällige" Zeilen. Übernehmen wir (siehe `ARCHITECTURE.md`).

**Design-Lehren, die wir ablehnen / verbessern:**
- `password` als `varchar(100)` ohne Hashing → wir hashen (argon2id).
- Überall zusammengesetzte Natural Keys → wir bevorzugen Surrogat-`bigint`-PKs mit Koordinaten-**Unique-Indizes**.
- JSON-Truppen-Blobs in einer relationalen Spalte → für fliegende Armeen ok, aber wir typisieren sie mit geteilten Zod-Schemas.

## Gebäudedaten (`modules/constructions/*.json`) — 25 Gebäude

Schema pro Datei: `{ id, name, info, bonus[{name, value[]}], adjascent[{builds[], bonus[]}], resourceCost[[wood,stone]...], score[] }`. Die Werte geben uns eine **konkrete Balance-Referenz**; die vollständige Extraktion lebt in `GAME-MECHANICS.md` (`[V]`, durch Fandom-Snapshots bestätigt). Highlights:

- **Produzenten** (`Woodcutter's Hut`, `Quarry`, `Farm`, `Iron mine`): Output pro Stufe, z. B. Holz `[5,10,15,20,30,45,75,120,200,300]/h` (OpenLoU-Variante; Fandom-Werte weichen ab und sind maßgeblich).
- **Verstärker** (`Sawmill`, `Stonemason`, `Foundry`, `Mill`): geben Adjazenz `+[30,35,…,75]%` an ihren Produzenten, plus Lagerbonus an angrenzendes Lager.
- **Cottage**: `+constructionspeed` und Adjazenz `+[3,6,…,30]%` an angrenzende Produzenten.
- Militär-Trainer, Caster-/Blessed-Gebäude, `Castle` (Armeegröße + Befehls-Queue) + `City Wall`.

⚠️ **IP-Flag:** zwei Gebäude tragen Ultima-Eigennamen — **„Moonglow Tower"** und **„Trinsic Temple"**. Diese Namen stehen in unserer Umbenennungs-Map und **dürfen** in unserem Projekt nicht erscheinen (siehe `IP-COMPLIANCE.md`).

## Was wir wiederverwenden (nur als Referenz, neu abgeleitet)

1. **Schema-Form** → informiert `GAME-DATA-SCHEMA.md` (zeitstempel-getriebene Queues, gecachter Adjazenz-Modifier, koordinaten-basierte Städte).
2. **Gebäude-Set + Zahlen pro Stufe** → Startwerte für `data/buildings.yaml`, gegen die Wikis gegengeprüft und confidence-getaggt.
3. **Adjazenz-Beziehungen** (welcher Verstärker boostet welchen Produzenten; Cottage→Produzenten) → bestätigt die Wiki-Mechanik.

## Was wir NICHT übernehmen

- Keinen Go-Code, keine `sqlboiler`-Modelle, keine wörtlichen JSON-Dateien (vermeidet GPLv3-Ableitungsstatus).
- Keine Annahme, dass OpenLoUs Zahlen korrekt sind — sie sind fehlerhaft und unvollständig; die Wikis sind maßgeblich.
