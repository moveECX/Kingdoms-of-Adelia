# Roadmap — Kingdoms of Adelia

> Phasen- und meilensteinbasiert. Jede Phase hat explizite **Akzeptanzkriterien** (die Messlatte für „fertig"). Das Tempo geht vom **hohen Wochenbudget** aus dem Bootstrap aus, daher sind die Schätzungen aggressiv. Der Server ist durchgehend autoritativ (`ARCHITECTURE.md`).
>
> **Stack-Hinweis (überschreibt den ursprünglichen Brief):** Phase 1 nutzt **PostgreSQL via Docker Compose**, *nicht* SQLite — PostgreSQL-überall ist gesetzt (`ARCHITECTURE.md`). „Kein SQLite" gilt ab Tag 1.

## Phase 1 — Solo-Prototyp  ·  ~1–2 Wochen
Eine lokale Stadt; die **Bauen → Produzieren → Ausbauen**-Schleife mit **funktionierender Adjazenz**. Kein Kampf, kein Netzwerk außer localhost, keine anderen Spieler.

**Akzeptanzkriterien**
- `docker compose up -d db` + ein Befehl startet Server + Client lokal.
- Eine Stadt mit fixen Terrain-Knoten gründen; Gebäude auf dem 9×9-Raster per UI platzieren/ausbauen/abreißen.
- Ressourcen wachsen **analytisch** (Rate × verstrichene Zeit, gedeckelt) und das HUD interpoliert flüssig; Bau-/Ausbau-Jobs schließen planmäßig über den Server-Tick ab.
- **Der Adjazenz-Multiplikator wird berechnet und beeinflusst die Produktion sichtbar** (Fandom-Modell), mit Vorschau vor dem Bau.
- `shared/formulas`-Unit-Tests für Adjazenz, Kosten, Produktion, Bauzeit grün; `data/*.yaml` lädt + validiert.

→ **Konkrete Ticketliste unten.**

## Phase 2 — Weltkarte & Monster  ·  ~2–3 Wochen
Mehrere Städte pro Account; eine **Weltkarten**-Ansicht; **PvE**-Kampf gegen Dungeon-/Monster-Spawns. Weiterhin Single-Player (keine anderen Accounts).

**Akzeptanzkriterien**
- Weltkarte (Canvas) rendert Tiles/Städte/Dungeons mit Pan/Zoom + Viewport-Culling.
- Weitere Städte gründen (Marshal + Kosten + 7-Tage-Schild); Städte-Cap pro Account je Titel.
- Einheiten trainieren; **Raids** auf Dungeons senden; deterministischer Kampf löst bei Ankunft auf; Loot kehrt zurück und wird gutgeschrieben (durch Carry gedeckelt).
- Dungeon-Fertigstellung + Loot-Tabellen entsprechen `GAME-MECHANICS.md` §7.

## Phase 3 — Multiplayer-Grundlagen  ·  ~2–3 Wochen
**Auth, Sessions, persistente gemeinsame Welt**, viele koexistierende Accounts. **Noch kein PvP.**

**Akzeptanzkriterien**
- Registrieren/Login (argon2id), Session-Cookies, ratenbegrenzte Endpoints (minimal — selbst gehostet).
- Eine persistente Welt; Spieler sehen die Städte der anderen auf der Karte; WS-Region-Rooms liefern Karten-Deltas.
- Server übersteht Neustart ohne Zustandsverlust; Scheduler nimmt fällige Events korrekt wieder auf.
- Chat (global + Stadt) über WS.

## Phase 4 — PvP & Wirtschaft  ·  ~3–4 Wochen
**Spieler-gegen-Spieler**-Kampf, der **Marktplatz** und **Allianzen**.

**Akzeptanzkriterien**
- Citadel-gegatete Angriffstypen (Scout/Plunder/Assault/Siege/Support); Nachtschutz; Wall-/Turm-/Fallen-Modifikatoren; Kampfberichte an beide Seiten.
- Marktplatz-Inserate + Karren-/Schiff-Transfers, die nach Reisezeit auflösen.
- Allianzen (≤100, Ränge, Diplomatie, Allianz-Chat/Forum, Event-Log).

## Phase 5 — Endgame  ·  ~2–3 Wochen
**Schreine, Paläste, Siegbedingungen, Bestenlisten.**

**Akzeptanzkriterien**
- Schreine aktivieren; Erleuchtung lässt castled Allianzstädte Paläste bauen/ausbauen (1/Erleuchtung).
- Allianz-**Faith** aggregiert pro Tugend mit dem dokumentierten Bonus; **Besitz eines L10-Palastes aller 8 Tugenden gewinnt** und beendet die Welt.
- Ranglisten/Bestenlisten (Spieler + Allianzen) und ein Champions-Eintrag.

---

## Phase 1 — Ticketliste (hier starten)

Tickets sind wo möglich vertikal. Definition of Done laut `CLAUDE.md`. **Beginne mit #001.**

**#001 — Monorepo & Toolchain-Bootstrap**
npm workspaces (`server`/`client`/`shared`), `tsconfig.base.json` (strict, Pfad-Aliase `@server/@client/@shared`), ESLint (`@typescript-eslint` strict) + Prettier und Root-Skripte (`dev`, `build`, `lint`, `test`, `typecheck`) aufsetzen.
*AC:* `npm install` im Root verdrahtet alle Workspaces; `npm run lint && npm run typecheck` laufen auf dem leeren Gerüst durch; `@shared/*`-Imports lösen aus Server und Client auf.

**#002 — Lokales PostgreSQL via Docker Compose**
`docker-compose.yml` mit `postgres:16-alpine`, benanntem Volume, env-gesteuerten Credentials; `.env.example`; README-Snippet.
*AC:* `docker compose up -d db` ergibt eine erreichbare DB; dokumentierte `DATABASE_URL` verbindet.

**#003 — Kysely-Setup + erste Migration**
Kysely + Migration-Runner verdrahten; Migration `0001_core` erstellt `accounts`, `cities`, `city_tiles`, `city_buildings`, `build_queue`; `schema.sql` generieren.
*AC:* `npm run migrate` ist idempotent up/down; Typen generiert; `schema.sql` passt.

**#004 — Geteilte Daten-Schemas + YAML-Loader**
Zod-Schemas für `buildings`/`units`/`resources`/`titles`; Loader validiert `data/*.yaml` beim Boot (Array-Längen = maxLevel, keine hängenden Refs, kein NaN).
*AC:* valide Daten laden; eine absichtlich kaputte Datei lässt den Boot mit präzisem Fehler scheitern; Loader unit-getestet.

**#005 — `data/buildings.yaml` + `data/resources.yaml` (Phase-1-Teilmenge)**
Produzenten-Familie, Verstärker, Cottage, Hall, Warehouse aus `GAME-MECHANICS.md` mit Confidence-Kommentaren transkribieren.
*AC:* Werte entsprechen dem Dokument; schema-valide; deckt jedes für die Phase-1-Schleife nötige Gebäude ab.

**#006 — `shared/formulas`: Kosten, Bauzeit, Produktion**
Reine Funktionen: `buildingCost(key,toLevel)`, `buildTimeSec(key,toLevel,constructionPct)`, `baseProduction(key,level)`. Deterministisch.
*AC:* Unit-Tests prüfen exakte Werte aus dem Dokument (z. B. Hall L7 = 15.000 Timber + 10.000 Stone).

**#007 — `shared/formulas`: Adjazenz**
Das Fandom-Modell `base×(1+Σnodes+Σcottages)×(1+enhancer)` implementieren, Max-ein-Verstärker-Regel, Seen-für-Farms.
*AC:* das Beispiel liefert 1.522,5/h; Gegenfälle (2. Verstärker ignoriert) getestet; Modell per Flag auf die daydull-Variante umschaltbar.

**#008 — Stadtgründung + fixer Terrain-Generator**
Server-Logik zum Erstellen einer Stadt: Hall im Zentrum, `city_tiles`-Knoten-Layout aus einem Seed (deterministisch) generieren, Start-Ressourcen/-Caps setzen.
*AC:* Gründen schreibt Tiles+Hall; gleicher Seed → gleiches Layout; Startzustand entspricht den `cities`-Defaults.

**#009 — Analytisches Ressourcenmodell + Materialisierung**
`shared/formulas/resources.ts` zur Ableitung aktueller Beträge; Server-Helfer zum Lesen (ableiten) und Materialisieren (Rückschreiben bei Ratenänderung/Verbrauch), gedeckelt auf Cap.
*AC:* Ableitung nach N Stunden ergibt den erwarteten gedeckelten Wert; Verbrauch/erneut-ableiten ist konsistent; getestet.

**#010 — Bau-Queue + Scheduler-Tick**
1-s-Scheduler, der `build_queue.resolve_at<=now()` pollt; bei Auflösung: Gebäudestufe setzen/erhöhen, `layout_dirty` markieren, Adjazenz + Produktion der Stadt neu berechnen, Ressourcen materialisieren.
*AC:* ein eingereihter L1→L2 schließt zur richtigen Zeit ab; Produktion aktualisiert; verspäteter Tick löst dennoch deterministisch auf; durch einen Integrationstest gegen eine Test-DB abgedeckt.

**#011 — Adjazenz-Neuberechnung bei Layout-Änderung**
Bei Platzieren/Ausbauen/Abreißen `adjacency_pct` + `production_h` für betroffene Slots neu berechnen; `layout_dirty` löschen.
*AC:* eine Sawmill neben zwei Woodcuttern hebt deren gecachte Produktion auf den Formelwert.

**#012 — Fastify-Server + REST: build/upgrade/demolish/city**
`/api/v1` mit Auth-Stub (einzelner Dev-Account), `GET /cities/:id`, `POST build|upgrade|demolish`, `DELETE queue/:id`, `GET /data/manifest`. Zod-validiert; ganzzahliges Geld.
*AC:* ein Client kann eine Stadt abrufen und die volle Schleife fahren; ungültige Befehle liefern typisierte 4xx; Leistbarkeits-/Voraussetzungs-/Slot-Checks server-seitig erzwungen.

**#013 — WebSocket-Deltas**
`/ws` mit `subscribe city:`, sendet `city.snapshot`, `city.delta`, `queue.resolved`, `resources.rate`.
*AC:* Bauen in einem Tab aktualisiert einen anderen abonnierten Client innerhalb eines Ticks ohne Reload.

**#014 — Client-Shell + Design-Tokens**
Svelte-5-+-Vite-App; `tokens.css` synchron mit `DESIGN-SYSTEM.md`; App-Shell (Ressourcen-HUD, Sidebar, Hauptansicht, Kontext-Panel) passend zu `design-system.html`.
*AC:* Shell rendert dunkel/datendicht; HUD zeigt Live-Ressourcen mit lokaler Interpolation; entspricht dem Look der Demo.

**#015 — Stadtraster-Ansicht + Bau-/Ausbau-UI**
Das 9×9-Raster aus dem Stadt-Zustand rendern; Klick auf leeren Slot → Gebäude-Auswahl (mit Kosten/Zeit/Output-**Vorschau** via `shared/formulas`); Klick auf bebauten Slot → Kontext-Panel (Ausbauen/Abreißen); Adjazenz-Highlight bei Hover.
*AC:* die volle Bauen→Produzieren→Ausbauen-Schleife ist end-to-end gegen den Server spielbar; Vorschauen entsprechen der Realität nach dem Bau.

**#016 — Dev-Seed + „Prototyp spielen"-Skript**
Ein `npm run seed`, das einen Dev-Account + eine Stadt mit glaubwürdigem Terrain-Layout erstellt; dokumentierter Ein-Befehl-Start.
*AC:* frischer Clone → `docker compose up -d db && npm run migrate && npm run seed && npm run dev` → eine spielbare einzelne Stadt im Browser.

*(16 Tickets. In Reihenfolge ziehen; #001–#003 sind Setup, #004–#011 die Engine, #012–#016 machen es spielbar.)*
