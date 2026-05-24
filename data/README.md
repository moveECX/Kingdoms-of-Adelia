# `data/` — Spiel-Balance-Daten

Spiel**regeln und Balance-Zahlen** leben hier als versionierte YAML, getrennt von Code und Datenbank. Der Server lädt und **validiert** diese gegen Zod-Schemas in `@adelia/shared` beim Boot (ROADMAP-Ticket #004); die DB speichert nur *Instanzen* (die konkrete L7-Quarry einer Stadt), nie die Regeln.

## Dateien
| Datei | Inhalt |
|---|---|
| `resources.yaml` | Die 5 Ressourcen + die Adjazenz-Modell-Konstanten. |
| `buildings.yaml` | Kosten / Output / Bauzeit / Effekte pro Stufe je Gebäude. |
| `units.yaml` | Einheiten-Stats, Trainer-/Freischaltstufen und Kampf-Konstanten. |
| `titles.yaml` | Titel-Leiter → max Städte / Citadels / Mana. |

## Konventionen
- `schemaVersion` (oben in jeder Datei) erhöht sich bei **struktureller** Änderung; Balance-Edits nicht. Per `GET /api/v1/data/manifest` exponiert, damit der Client nur gegen ein passendes Regelwerk vorschaut (`GAME-DATA-SCHEMA.md` §5).
- **Keys sind stabile Strings** (`quarry`, `knight`) — von DB-Zeilen und Code referenziert. Einen Key umzubenennen ist eine Migration.
- **Stufen-Arrays sind Index 0 → Stufe 1**, Länge **muss `maxLevel` entsprechen** (Loader erzwingt es).
- `cost`-Einträge sind `[timber, stone]`; Einheiten-`cost` ist `{timber, stone, iron, gold}`. Alles ganzzahlig.
- Namen folgen `IP-COMPLIANCE.md`; der LoU-Quellname steht zur Nachvollziehbarkeit im Kommentar.

## Herkunft & Confidence
Werte sind aus `GAME-MECHANICS.md` transkribiert, das jede Zahl `[V]`/`[A]`/`[U]` taggt:
- Gebäude-Kosten/-Output/-Zeit = **[V]** (Fandom-Rohwikitext-Snapshots in `research/wiki-snapshots/`).
- Numerische Einheiten-Stats = **[A]** (Community/Ultima Codex) — Playtest-Tuning erwartet.
- Die Adjazenz-Cottage-Gruppierung und einige Werte sind **offene Konflikte** (`RESEARCH-LOG.md`); die Formel lebt hinter Tests in `shared/formulas`, ist also nachjustierbar.

Wenn du einen Wert änderst, aktualisiere `GAME-MECHANICS.md` und ergänze eine datierte Notiz in `RESEARCH-LOG.md`.
