# Wiki-Snapshots — lokaler Mirror & Attribution

Lokale Kopien von Community-Wiki-Quellen als **Referenz**, damit das Projekt nicht davon abhängt, dass diese Seiten online bleiben. Wir extrahieren **Fakten und Zahlen** (Spielmechaniken — nicht schützbar) nach `GAME-MECHANICS.md`; diese Snapshots sind die Belegspur.

Geladen am **2026-05-24** via `curl` mit Browser-User-Agent + MediaWiki-`?action=raw` (sauberer Wikitext; direkte Bot-Fetches an Fandom liefern HTTP 403).

## Inhalt
| Ordner | Quelle | Format | Lizenz |
|---|---|---|---|
| `fandom/` | Lord of Ultima Wiki — `lordofultima.fandom.com` | Rohwikitext | **CC BY-SA 3.0** |
| `ultimacodex/` | The Ultima Codex — `wiki.ultimacodex.com` | Rohwikitext | **CC BY-SA** |
| `wikipedia/` | Wikipedia (EN + DE) — `*.wikipedia.org` | Rohwikitext | **CC BY-SA 4.0** |

`fandom/` ist der Großteil: Gebäude-Tabellen pro Stufe (Kosten/Output/Bauzeit), `Resources` (Adjazenz), `Combat_Mechanics`, `Units`, `Cities`, `World_Setup`, `Continents`, `Alliances`, `Palaces`, `Shrine`, `Dungeons`, `Trade`, Türme/Fallen usw. `ultimacodex/` enthält `Lord_of_Ultima_monster_data` (die Einheiten-Stat-Quelle) + `Raiding`/`Construction`/`Titles`.

## Attribution
Diese Referenzdateien bleiben unter ihren **ursprünglichen CC-BY-SA-Lizenzen**; es sind unveränderte Quell-Kopien, den jeweiligen Wikis und ihren Mitwirkenden zugeschrieben. Sie sind getrennt von unserem eigenen (eigenständig lizenzierten, AGPL-3.0) Code und unseren Assets. Wiederverwendung von Prosa daraus muss CC-BY-SA-Attribution + Share-Alike wahren.

## Hinweis zu Crown of the Gods
CotG-Mechaniken wurden von der offiziellen Seite (`crownofthegods.com/about/*`) und dem Community-Wiki recherchiert, und die **Fakten** wurden nach `GAME-MECHANICS.md` / `RESEARCH-LOG.md` transkribiert. Jene Seiten sind **© Gaming Addict Studios** (nicht CC-lizenziert), daher wird ihr voller HTML **nicht** hier weiterverbreitet. Live-Verweise stehen in `RESEARCH-LOG.md`.

## Erinnerung
Dieser Ordner enthält **CC-BY-SA-Referenzmaterial**, nicht unseren Inhalt. Unser Spiel nutzt nur die nicht schützbaren Fakten daraus, mit eigenen Namen/Grafik/Lore laut `IP-COMPLIANCE.md`. (Das separate `research/reference-repos/` — GPLv3-OpenLoU-Code + EA-eigene FelixLeChat-Assets — ist **gitignored** und wird nie committet.)
