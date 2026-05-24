# Repository-Entscheidung — Neu bauen vs. forken

> Entscheidungsdatum: 2026-05-24. Status: **ENTSCHIEDEN — neu in TypeScript bauen.**

## Entscheidung

**Eine Clean-Room-Implementierung von Grund auf in TypeScript bauen.** Die zwei Referenz-Repos und die Community-Wikis nur als **Referenz für Mechaniken, Balance-Zahlen und Schema-Form** nutzen — Fakten transkribieren (die nicht schützbar sind), niemals Code oder Assets kopieren.

## Erwogene Optionen

### Option A — `OpenLoU` forken (Go + PostgreSQL)
- ➖ **Sprach-Mismatch:** Go, aber unser gesetzter Stack ist TypeScript auf Client + Server (`ARCHITECTURE.md`). Ein Fork hieße, unseren Stack aufzugeben oder ohnehin neu zu schreiben.
- ➖ **GPLv3-Copyleft:** Ableiten aus dem Code zwingt unser ganzes Projekt unter GPLv3. (Wir wählen AGPL bewusst selbst — siehe unten.)
- ➖ **Unreif:** „nichts funktioniert wirklich"; nur Gerüst, eine Einheit, kein Tick-Loop, fehlerhafte Daten.
- ➕ Wirklich nützliches **PostgreSQL-Schema** und **externe JSON-Gebäudedaten**.

### Option B — `FelixLeChat/LordOfUltima` forken (C#/.NET WPF)
- ➖ **Falsche Plattform:** Windows-Desktop-App, kein Browser-MMO.
- ➖ **Falsche Sprache:** C#.
- ➖ **Keine Lizenz → alle Rechte vorbehalten:** Code rechtlich nicht nutzbar.
- ➖ **IP-Gefahr:** 30 MB EA-eigene, gerippte Assets.
- ➕ Bestätigt das Gebäude-Set und dass LoU Forschung + Dungeon/Boss-PvE hatte.

### Option C — Neu in TypeScript bauen ✅ (GEWÄHLT)
- ➕ Passt durchgängig zum gesetzten Stack (TS strict, Vite-Client, Node/Postgres-Server).
- ➕ Keine Lizenz-Verstrickung; wir wählen unsere eigene (**AGPL-3.0-or-later**).
- ➕ Server-autoritativer Tick-Loop und WebSocket-Design von Tag 1 auf unsere Bedürfnisse zugeschnitten.
- ➕ Erlaubt sauberes Datenmodell (typisierte geteilte Schemas) statt fehlerhafter Daten zu erben.
- ➖ Mehr Aufwand vorab — gemildert durch das hohe Wochenbudget und das reiche, legal nutzbare Referenzmaterial.

## Was „nur Referenz" bedeutet (die rechtliche Linie)

| Erlaubt ✅ | Nicht erlaubt ❌ |
|---|---|
| Lesen & Transkribieren **numerischer Werte** (Kosten, Produktionskurven, Stufen-Caps) — das sind Fakten | OpenLoU-`.go`/`.json` oder FelixLeChat-`.cs` wörtlich kopieren |
| **Spielmechaniken & Formeln** replizieren (Adjazenz, Kampf) — Mechaniken sind nicht schützbar | Kreative **Prosa** (Tooltip-/Lore-Text) Wort für Wort reproduzieren |
| Von der **Schema-Form** lernen und eigene ableiten | GPLv3-Code einziehen (würde uns relizenzieren) |
| Das **Gebäude-/Einheiten-Set** bestätigen | **Irgendein Art-/Audio-Asset** aus FelixLeChat (EA-eigen) verwenden |

Alle transkribierten Werte sind in `GAME-MECHANICS.md` `[V]`/`[A]`/`[U]` getaggt, OpenLoU-Zahlen explizit als solche markiert und gegen die Wikis gegengeprüft.

## Konsequenzen

- Referenz-Repos liegen unter `research/reference-repos/` und sind **gitignored** (hält EA-Assets und GPLv3-Code aus unserer Historie).
- Unser Schema ist frisch in `GAME-DATA-SCHEMA.md` definiert, informiert von — nicht kopiert aus — OpenLoUs `db.sql`.
- Unsere Balance-Daten leben in eigenen `data/*.yaml`-Dateien, gefüllt mit wiki-verifizierten Zahlen.
- Projektlizenz: **AGPL-3.0-or-later** (`LICENSE`).
