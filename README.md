# Kingdoms of Adelia

Ein browserbasiertes **MMO-Aufbaustrategiespiel** — eigene IP, in der Gameplay-Linie von *Lord of Ultima* und *Crown of the Gods* (beide längst eingestellt). Lege deine Stadt so an, dass die **Nachbarschafts-Boni (Adjazenz)** optimal greifen, lass ein Grenzland-Reich wachsen, plündere Ruinen, treibe Handel und ringe mit deiner Allianz um uralte Schreine.

> **Status:** Planungs- & Recherchephase **abgeschlossen** (2026-05-24). Noch **kein Gameplay-Code** — die Umsetzung beginnt bei **Phase 1, Ticket #001** (`ROADMAP.md`). „Adelia" ist der Name des Reichs/der Welt.

## Tech-Stack
TypeScript (strict) durchgängig · **Svelte 5 + Vite** (Client) · **Fastify + `ws`** (Server) mit autoritativem **Tick-Scheduler** · **PostgreSQL 16 + Kysely** · **Zod** für geteilte Schemas/Formeln. Vollständige Begründung in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Schnellstart
> Wird durch ROADMAP-Tickets #001–#003 verdrahtet; bis dahin ist dies der geplante Ablauf.
```bash
cp .env.example .env
docker compose up -d db      # PostgreSQL 16 im Container
npm install                  # installiert alle Workspaces (shared/server/client)
npm run migrate              # Schema anlegen
npm run seed                 # Dev-Account + eine Startstadt
npm run dev                  # Server (:3000) + Client (:5173)
```

## Dokumentation
Beginne mit **[`CLAUDE.md`](./CLAUDE.md)** — der zentralen Übergabe (Mission, Aufbau, Befehle, nächste Schritte).

| Dokument | Inhalt |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Stack, Modulgrenzen, Tick-Loop, Datenflüsse |
| [`GAME-MECHANICS.md`](./GAME-MECHANICS.md) | Ressourcen, Adjazenz, Gebäude, Einheiten, Kampf, Sieg |
| [`GAME-DATA-SCHEMA.md`](./GAME-DATA-SCHEMA.md) | DB-Schema, `data/*.yaml`, REST- + WS-Verträge |
| [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) | Dunkle, datendichte UI-Tokens + Komponenten (+ `client/design-system.html`) |
| [`ROADMAP.md`](./ROADMAP.md) | 5 Phasen + die Phase-1-Ticketliste |
| [`IP-COMPLIANCE.md`](./IP-COMPLIANCE.md) | Rechtliche Grenzen, Umbenennungs-Map, Asset-Regeln |
| [`RESEARCH-LOG.md`](./RESEARCH-LOG.md) | Datierte Erkenntnisse; bestätigt vs. offen |

## Lizenz & IP
**AGPL-3.0-or-later** (siehe [`LICENSE`](./LICENSE)). © 2026 moveECX. Dies ist eine Clean-Room-Reimplementierung von Spiel-*Mechaniken* (nicht urheberrechtlich schützbar) mit **vollständig eigenen** Namen, Grafiken und Lore. Es werden **keine** Assets oder Code aus den Referenzprojekten verwendet. Siehe [`IP-COMPLIANCE.md`](./IP-COMPLIANCE.md).
