# `data/` — Game balance data

Game **rules and balance numbers** live here as version-controlled YAML, kept out of both code and database. The server loads and **validates** these against zod schemas in `@aldermark/shared` at boot (ROADMAP ticket #004); the DB stores only *instances* (a specific city's L7 Quarry), never the rules.

## Files
| File | Contents |
|---|---|
| `resources.yaml` | The 5 resources + the adjacency model constants. |
| `buildings.yaml` | Per-level cost / output / build-time / effects for each building. |
| `units.yaml` | Per-unit stats, trainer/unlock levels, and combat constants. |
| `titles.yaml` | Title ladder → max cities / citadels / mana. |

## Conventions
- `schemaVersion` (top of each file) bumps on **structural** change; balance edits don't bump it. Exposed via `GET /api/v1/data/manifest` so the client only previews against a matching ruleset (`GAME-DATA-SCHEMA.md` §5).
- **Keys are stable strings** (`quarry`, `knight`) — referenced by DB rows and code. Renaming a key is a migration.
- **Level arrays are index 0 → level 1**, length **must equal `maxLevel`** (loader enforces).
- `cost` entries are `[timber, stone]`; unit `cost` is `{timber, stone, iron, gold}`. All integers.
- Names follow `IP-COMPLIANCE.md`; the LoU source name is noted in a comment for traceability.

## Provenance & confidence
Values are transcribed from `GAME-MECHANICS.md`, which tags every number `[V]`/`[A]`/`[U]`:
- Building cost/output/time = **[V]** (Fandom raw-wikitext snapshots in `research/wiki-snapshots/`).
- Unit numeric stats = **[A]** (community/Ultima Codex) — expect playtest tuning.
- The adjacency cottage-grouping and a few values are **open conflicts** (`RESEARCH-LOG.md`); the formula lives behind tests in `shared/formulas` so it's re-tunable.

When you change a value, update `GAME-MECHANICS.md` and add a dated note to `RESEARCH-LOG.md`.
