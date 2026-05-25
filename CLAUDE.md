# CLAUDE.md — Zentrale Übergabe

> **Zuerst lesen, in jeder Session.** Dies ist die Karte; die anderen Dokumente sind das Gelände. Halte den Abschnitt **Aktueller Kontext** (unten) am Ende jeder Session aktuell.
>
> **Projektsprache: Deutsch.** Alle `.md`-Dokumente werden auf Deutsch geführt. Code, Bezeichner, SQL-/YAML-Keys und (vorerst) die Gebäude-/Einheiten-Anzeigenamen bleiben englisch.

## Mission & Umfang
Kingdoms of Adelia ist ein browserbasiertes, server-autoritatives **MMO-Aufbaustrategiespiel** — eine Clean-Room-Reimplementierung des Gameplays von *Lord of Ultima* / *Crown of the Gods* mit **vollständig eigener** Marke, Thematik (eigene mittelalterliche Mythologie), Grafik und Lore. Die Kernmechanik ist die **Optimierung der Stadtraster-Nachbarschaft (Adjazenz)**; das Endgame ist Allianz-Eroberung und der Sieg über Schreine/Paläste. Ziel-Deployment ist **selbst gehostet, eine gemeinsame Welt**. Wir replizieren Mechaniken und Balancing-Zahlen (Fakten, nicht urheberrechtlich schützbar) und erfinden alles Ausdruckshafte — siehe `IP-COMPLIANCE.md`.

## Tech-Stack (Details in `ARCHITECTURE.md`)
- **TypeScript strict** auf Client + Server + Shared. Kein `any`; kein `@ts-ignore` ohne Begründung.
- **Client:** Svelte 5 (Runes) + Vite; reines CSS + Design-Tokens; Stadtraster = CSS/SVG, Weltkarte = Canvas 2D.
- **Server:** Node + Fastify (REST) + `ws` (Live-Deltas) + 1-s-**Tick-Scheduler**; autoritativ.
- **DB:** PostgreSQL 16 + Kysely (typsicherer Query-Builder + Migrationen). **Kein SQLite, niemals.**
- **Shared:** Zod-Schemas (REST/WS/Daten-Verträge) + **reine Formeln** (Adjazenz, Kosten, Produktion, Kampf), die der Server als Wahrheit und der Client für Vorschauen nutzt.

## Repository-Aufbau
```
CLAUDE.md ARCHITECTURE.md GAME-MECHANICS.md GAME-DATA-SCHEMA.md
DESIGN-SYSTEM.md ROADMAP.md IP-COMPLIANCE.md RESEARCH-LOG.md README.md LICENSE
package.json tsconfig.base.json docker-compose.yml .env.example eslint.config.js
shared/   schemas/ constants/ types/ formulas/         # umgebungsneutral; kein fs/window
server/   src/ db/{migrations,schema.sql} game/ routes/ ws/
client/   src/ public/ assets/ design-system.html      # NUR eigene Assets
data/     buildings.yaml units.yaml resources.yaml titles.yaml README.md
research/ REPO-DECISION.md openlou-analysis.md lordofultima-felix-analysis.md
          wiki-snapshots/        (committeter Mirror)
          reference-repos/       (GITIGNORED — GPLv3-Code + EA-Assets)
```

## Befehle
| Aufgabe | Befehl |
|---|---|
| DB starten | `docker compose up -d db` |
| Installieren | `npm install` (Root; verdrahtet alle Workspaces) |
| Migrieren / Seed | `npm run migrate` · `npm run seed` |
| Dev (Server+Client) | `npm run dev` |
| Typecheck / Lint / Format | `npm run typecheck` · `npm run lint` · `npm run format` |
| Tests | `npm test` (Vitest) |

## Coding-Standards
- **Strict TS**, kein `any`; jede Ausnahme bekommt einen Kommentar, der das Warum erklärt.
- **Dateien < 300 Zeilen** bevorzugt, **harte Grenze 500** — konsequent aufteilen.
- **Keine Barrel-`index.ts`**, die die Struktur verschleiern.
- **Keine verfrühte Abstraktion** — keine `Manager`/`Helper`/`Service`/`Util`-Klassen ohne konkreten Bedarf.
- **Testen, was zählt**: Formeln, Kampf, Tick-/Scheduler-Auflösung, Schema-Validierung. UI-Kleinkram auslassen.
- **Kommentare erklären das *Warum***, nicht das Was. Zuerst selbsterklärender Code.
- **Imports über Pfad-Aliase** (`@shared/...`, `@server/...`, `@client/...`), nicht über tiefe relative Pfade.
- **Conventional Commits**: `feat: fix: chore: docs: refactor: test:`.
- **Determinismus**: alle Spiel-Mathematik sind reine Funktionen von `(state, data, timestamps)` — reproduzierbar, ohne DB testbar.

## Welches Dokument deckt was ab
| Bedarf | Dokument |
|---|---|
| Warum eine Tech-Entscheidung; Tick-Loop; Datenflüsse | `ARCHITECTURE.md` |
| Eine Formel / Kosten / Einheiten-Stat / Siegregel | `GAME-MECHANICS.md` (jeder Wert mit `[V]`/`[A]`/`[U]` getaggt) |
| Eine Tabelle/Spalte; API- oder WS-Nachricht; Datendatei-Form | `GAME-DATA-SCHEMA.md` |
| Ein Farb-/Abstands-Token oder eine Komponente | `DESIGN-SYSTEM.md` (+ `client/design-system.html`) |
| Was als Nächstes zu bauen ist; Akzeptanzkriterien | `ROADMAP.md` |
| Darf ich diesen Namen/dieses Asset verwenden? | `IP-COMPLIANCE.md` |
| Woher stammt eine Zahl? | `RESEARCH-LOG.md` |
| Warum die OSS-Repos nicht forken? | `research/REPO-DECISION.md` |

## Definition of Done (ein Feature)
1. Verhalten entspricht `GAME-MECHANICS.md` (oder das Dokument wird aktualisiert + `RESEARCH-LOG.md` ergänzt).
2. Server-autoritativ; der Client kann keinen Zustand erfinden (Vorschauen nur über `shared/formulas`).
3. Eingaben durch geteilte Zod-Schemas validiert; Fehler sind typisiert.
4. Tests für die Logik, die falsch sein kann (Formeln/Scheduler/Validierung), sind grün.
5. `npm run typecheck && npm run lint && npm test` sauber; Dateien innerhalb der Größengrenzen.
6. Akzeptanzkriterien des zugehörigen ROADMAP-Tickets erfüllt.

## Offene Fragen / Entscheidungen
- **Gebäude-/Einheiten-Anzeigenamen** sind aktuell englisch (LoU-nahe Umbenennung). Eindeutschung ist eine spätere **Inhalts**-Aufgabe (laut Wunsch: „erst Stand übernehmen, später anpassen").
- **Seltene Ressourcen / Premiumwährung**: für ein selbst gehostetes Spiel minimal/zurückgestellt; in Phase 4–5 erneut prüfen.

## Bereits entschieden (nicht erneut fragen)
- **Name:** Kingdoms of Adelia (Reich/Welt = „Adelia"). Zentral in `shared/constants/`.
- **Lizenz:** **AGPL-3.0-or-later** (`LICENSE`). © 2026 moveECX.
- **Mechaniken:** LoU-Baseline wie dokumentiert übernehmen; Inhalte später anpassen.
- Locked aus dem Bootstrap: TypeScript strict, kein React/Next, PostgreSQL (kein SQLite).

---

## Aktueller Kontext
**Stand (2026-05-25): Phase 1–4 abgeschlossen — Aufbau/PvE + PvP-Kampf, Belagerung/Eroberung, Marktplatz und Allianzen im Browser spielbar. Als Nächstes Phase 5 (Endgame).**

- **Phase 1 (Solo-Prototyp):** shared/formulas (Adjazenz/Kosten/Bauzeit/Produktion/Terrain/Ressourcen), DB (Postgres 16 + Kysely, `0001_core`), Server-Loop (Gründung/Bau/Scheduler), Fastify-REST + WebSocket-Deltas, Svelte-Client (Stadtraster + Bau-UI).
- **Phase 2 (Weltkarte & Monster):** Kampfformel (`shared/formulas/combat`, §5-verifiziert), Migration `0002` (garrison/training/military_actions/combat_reports/dungeons), Einheiten-Training, Dungeons + Raid/Combat-Auflösung (Loot capped by carry, 2-Phasen-Bewegung), Multi-City (Cap je Titel), **Canvas-Weltkarte + Militär-UI**.
- **Phase 3 (Multiplayer-Grundlagen):** Auth — `scrypt`-Passwörter (`server/src/auth/password.ts`), signierte Session-Cookies (`@fastify/cookie`, `session.ts`), `register`/`login`/`logout` (`routes/auth.ts`), **Rate-Limit 10/min** auf `auth/*` (`@fastify/rate-limit`, `global:false`). Autorisierung auf allen Stadt-Endpoints via `auth/guard.ts` (`requireAccount`/`requireCityOwner` → 401/403) inkl. WS-`subscribe`. Seed mit **mehreren Accounts** (dev/aldara/borin, Passwort `password123`). **Chat global + Stadt** über WS (`ws/hub.ts`). **WS-Map-Room**: neu gegründete Städte erscheinen live als `map.delta`. Client: **Login-/Register-UI** (`LoginPanel.svelte`), Chat mit Kanal-Umschalter (`ChatPanel.svelte`), fremde Städte auf der Karte (eigene=gold, fremd=blau, mit Besitzername).
- **Phase 4 (PvP & Wirtschaft):** PvP-Angriffe **Scout/Plunder/Assault/Siege** (`server/src/game/pvp.ts`) — Citadel-Gate, Garnison-Kampf, **City-Wall/Turm/Fallen**-Modifikatoren + **Nachtschutz** (datengetrieben aus `units.yaml combat`), Loot, **Belagerung→Eroberung** (Marshal, 10%/6% pro Welle, Besitzerwechsel bei 100%; Migration 0003 `siege_progress`), **Kampfberichte beidseitig**. Bewegung in `movement.ts`, Auflösungs-Routing in `military.ts`. **Marktplatz** (`market.ts`, Migration 0004): Inserate Ressource↔Gold + Transfer-Lieferung nach Reisezeit. **Allianzen** (`alliance.ts`, Migration 0005): ≤100, Ränge, Diplomatie, **Allianz-Chat** (WS, `hub.broadcastToAccounts`), Event-Log. Client: Angriffs-UI + Berichte + Markt + Allianz-Panel, Chat-Kanäle global/Stadt/Allianz.
- Tests: **38 Unit-Tests** (inkl. Nachtschutz/Türme/Fallen) + Smoke-Skripte (`server/src/dev/*-smoke.ts`): build/train/raid, `ws-smoke`, `resume-smoke`, `map-smoke`, `pvp-smoke`, `siege-smoke` (Eroberung), `market-smoke`, `alliance-smoke`.

**Lokaler Start:** `docker compose up -d db` (Host-Port **5433**) → `npm run migrate` → `npm run seed` → `npm run dev` → **http://localhost:5173** → Login `dev` / `password123` (Stadt bauen · Weltkarte · Truppen · Chat).

**Als Nächstes → Phase 5 (Endgame, `ROADMAP.md`):** Schreine (8 Tugenden) aktivieren; Paläste in castled Allianzstädten (3×3, max L10, 1/Tugend); allianzweite **Faith** pro Tugend (Bonus = Faith ÷ 2, gedeckelt 100%); **Sieg = L10-Palast aller acht Tugenden** → Welt endet; Ranglisten. Login: `dev` / `password123` (Seed).

**Offene Punkte (technische Schuld, bewusst):**
- Passwort-Hashing nutzt `node:crypto` **scrypt** (argon2 baut auf Node 25 ohne Build-Tools nicht). `SESSION_SECRET` in `.env` setzen (Dev-Fallback `dev-secret-change-me`).
- **Kysely 0.27** hat eine als „high" gemeldete SQL-Injection-Advisory (JSON-Path-Keys / `sql.lit`-MySQL-Backslash / `Kysely<any>`). Praktische Exposure niedrig (Postgres, kein JSONPath-Builder, durchgängig typisiertes `Kysely<Database>`); Fix = Breaking-Major (0.29) → als separates Dependency-Upgrade einplanen.
- Karten-Deltas laufen über **einen** globalen WS-Map-Room; echte Koordinaten-Partitionierung (Sharding nach Region) ist eine spätere Optimierung für große Welten.
- Militärgebäude: Rekrutiertempo-Bonus noch nicht angewandt; Trainingszeiten/Monster-Stats/Gründungskosten sind Dev-Werte `[A]` → Balancing-Pass ausstehend.
- REST: `demolish`/`queue-cancel` fehlen; Ausbau via `/build`.
- Mutationen (`startBuild`/`startTraining`/`startRaid`) ohne DB-Transaktion (Single-Player ok; bei Concurrency/PvP absichern).
- Prod-Build: `@adelia/shared`-exports zeigen auf `.ts` (dev/tsx/Vite); für `node dist` auf `dist/*.js` umstellen.
- **Phase-4-Vereinfachungen (Content/Balancing, bewusst):** Support-Angriff fehlt; Türme/Fallen sind im Kampf verdrahtet (`pvp.ts cityDefenseModifiers`), aber noch nicht baubar (nicht in `buildings.yaml`); Markt-Transfer nutzt Karren-Tempo ohne Schiff/Cap-Unterscheidung; Reisezeit dev-pauschal 60 s/Tile (nicht truppen-/typspezifisch); Eroberung übernimmt eine geleerte Garnison; Mutationen weiterhin ohne DB-Transaktion (bei PvP-Concurrency absichern).
