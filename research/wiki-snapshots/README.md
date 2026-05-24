# Wiki snapshots — local mirror & attribution

Local copies of community wiki source for **reference**, so the project doesn't depend on these sites staying online. We extract **facts and numbers** (game mechanics — not copyrightable) into `GAME-MECHANICS.md`; these snapshots are the provenance trail.

Fetched **2026-05-24** via `curl` with a browser User-Agent + MediaWiki `?action=raw` (clean wikitext; direct bot fetches to Fandom return HTTP 403).

## Contents
| Folder | Source | Format | License |
|---|---|---|---|
| `fandom/` | Lord of Ultima Wiki — `lordofultima.fandom.com` | raw wikitext | **CC BY-SA 3.0** |
| `ultimacodex/` | The Ultima Codex — `wiki.ultimacodex.com` | raw wikitext | **CC BY-SA** |
| `wikipedia/` | Wikipedia (EN + DE) — `*.wikipedia.org` | raw wikitext | **CC BY-SA 4.0** |
| `cotg/` | *(see note)* | — | — |

`fandom/` is the bulk: per-building per-level tables (cost/output/build-time), `Resources` (adjacency), `Combat_Mechanics`, `Units`, `Cities`, `World_Setup`, `Continents`, `Alliances`, `Palaces`, `Shrine`, `Dungeons`, `Trade`, towers/traps, etc. `ultimacodex/` includes `Lord_of_Ultima_monster_data` (the unit-stat source) + `Raiding`/`Construction`/`Titles`.

## Attribution
These reference files remain under their **original CC BY-SA licenses**; they are unmodified source captures, attributed to the respective wikis and their contributors. They are kept separate from our own (independently licensed) code and assets. Reuse of any prose from them must preserve CC BY-SA attribution + share-alike.

## Note on Crown of the Gods
CotG mechanics were researched from the official site (`crownofthegods.com/about/*`) and the community wiki, and the **facts** were transcribed into `GAME-MECHANICS.md` / `RESEARCH-LOG.md`. Those pages are **© Gaming Addict Studios** (not CC-licensed), so their full HTML is **not redistributed** here. Live references are listed in `RESEARCH-LOG.md`.

## Reminder
This folder holds **CC BY-SA reference material**, not our content. Our game uses only the non-copyrightable facts extracted from it, with original names/art/lore per `IP-COMPLIANCE.md`. (The separate `research/reference-repos/` — GPLv3 OpenLoU code + EA-owned FelixLeChat assets — is **gitignored** and never committed.)
