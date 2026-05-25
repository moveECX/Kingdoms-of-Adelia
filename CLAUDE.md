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
**Stand (2026-05-25): Phase 1 abgeschlossen — Solo-Prototyp spielbar.** Alle 16 Phase-1-Tickets erledigt + verifiziert:
- **shared/formulas** (rein, 26 Unit-Tests): Adjazenz (Fandom-Modell, daydull-Variante per Flag), Kosten, Bauzeit, Produktion, Terrain-Generator, Ressourcenmodell, `computeCityProduction`.
- **DB**: PostgreSQL 16 + Kysely, Migration `0001_core` (gegen DB gelaufen, `schema.sql`).
- **Server**: Gründung/Bau/Scheduler/Adjazenz-Loop; Fastify-REST (`/api/v1/cities`, `/build`, `/me`, `/data/*`) + WebSocket-Deltas; Tick-Scheduler.
- **Client**: Svelte 5 + Vite — Stadtraster (9×9), Bau-UI mit Vorschau, Live-Ressourcen-HUD.
- Verifiziert end-to-end über den Vite-Proxy (`:5173` → `:3000`).

**Lokaler Start:** `docker compose up -d db` (Host-Port **5433**) → `npm run migrate` → `npm run seed` → `npm run dev` → **http://localhost:5173**.

**Als Nächstes → Phase 2 (Weltkarte & Monster, `ROADMAP.md`):** Multi-City, Canvas-Weltkarte, PvE gegen Dungeons. Vorarbeiten: Welt-/Map-Schema, `units.yaml` vervollständigen (aktuell Starter-Subset), **`shared/formulas/combat`** nach `GAME-MECHANICS.md` §5 implementieren (Formel ist `[verified]`).

**Offene Punkte aus Phase 1 (technische Schuld, bewusst):**
- Militärgebäude (Trainer) haben nur Kosten/Bauzeit, keine Rekrutier-Wirkung (Phase 2).
- REST: `demolish`/`queue-cancel` fehlen; Ausbau läuft über `/build` (belegter Slot).
- API-Request-Schemas inline (zod) statt in `shared/schemas/api` — bei Bedarf extrahieren.
- Prod-Build: `@adelia/shared`-exports zeigen auf `.ts` (für tsx/Vite); für `node dist` auf `dist/*.js` umstellen.
- `startBuild`/`materialize` ohne Transaktion (Single-Player ok; bei Concurrency absichern).
