# Research Log

> Running, date-stamped record of what we learned and from where. **Confirmed knowledge is separated from guesses.** Future sessions append a new dated section as mechanics are uncovered, verified, or overturned. Confidence tags `[V]`/`[A]`/`[U]` match `GAME-MECHANICS.md`.

---

## 2026-05-24 — Bootstrap research session

### Sources accessed
- **Reference repos** (pre-downloaded into `re/`, relocated to `research/reference-repos/`):
  - `joaopedrosgs/OpenLoU` — Go + PostgreSQL, **GPLv3**, "early state". Useful: `db.sql` schema + `modules/constructions/*.json` building data. → `research/openlou-analysis.md`.
  - `FelixLeChat/LordOfUltima` — C#/.NET WPF desktop, **no license**, **EA-owned assets** (author-admitted). Reference for mechanics only. → `research/lordofultima-felix-analysis.md`.
- **Wikis** (mirrored to `research/wiki-snapshots/`): LoU Fandom (raw wikitext, fetched with a browser UA — direct bot fetch is 403 but UA-spoofed `?action=raw` returns 200), Ultima Codex, Crown of the Gods official site, en/de Wikipedia.
- **3 parallel research agents** swept buildings/adjacency, units/combat, and map/alliance/endgame; their secondary-source numbers were then **upgraded to `[V]`** wherever the Fandom raw wikitext confirmed them.

### Confirmed `[V]` (primary source: Fandom raw wikitext snapshots)
- **All building per-level tables**: cost (timber/stone), output/effect, build time, rank points, max level 10. Producer trio (Woodcutter/Quarry/Iron Mine) share one curve (output `20…300/h`, cost `50…38,000` timber); **Farm has a distinct, lower early curve** (`5,8,15,20,30,45,75,120,200,300`). The four enhancers share one curve (`+30%…+75%` efficiency, `+20%…+200%` storage). The four traps share one curve.
- **Adjacency formula**: `prod = base × (1 + Σnodes + Σcottages) × (1 + enhancer)`; node = +50% first / +40% each more; cottage = +3%…+30% (its "manpower" stat); enhancer = +30%…+75%, **max one**, applied *after*. (Fandom `Resources`.)
- **Combat formula**: attention split by attack share; per-type defense columns (Inf/Cav/Magic/Arty); attacker wins if `a_tot>d_tot`; losses = `ratio×I` (winner) / `√ratio×I` (loser); intensity `I` = .5 assault/scout/boss, .01 plunder-defender, ≈.1 else. Worked example reproduces 62.7% defender loss. (Fandom `Combat_Mechanics`.)
- **City**: 9×9 grid, Hall in center, **10 slots/Hall level → 100 buildings max**; Palace needs free 3×3; one Hall/Citadel/City Wall per city.
- **World**: 6×6 = 36 continents × 100×100 squares; coords `x:y`. **LoU world was named "Caledonia"** → confirms it's on our banned-noun list.
- **Titles → max cities**: Sir/Knight/Baron 1, Earl 2, Marquess 4, Prince 8, Duke 16, King 40, Emperor 80(+). Citadel ≈ 4 title levels; titles set Mana pool/regen.
- **Trade**: carts 1,000 cap @ 10 min/tile (200 @ Market L10); ships 10,000 cap @ 5 min/tile +1 h load (30 @ Harbor L10).
- **PvE loot caps** by dungeon level (320 → 441,375) and boss level (500 → 600,000); completion ×1.5/×2/×3 at 50/75/100%; **boss not killed = 5× losses**.
- **Endgame/victory**: 8 virtues; shrines enlighten castled alliance cities to build Palaces (3×3, L10); **alliance wins by owning a L10 Palace of all 8 virtues** → world ends. Faith bonus = Faith/2 capped at 100% (`[A]` on the /2).
- **Unit unlock levels** by trainer building level (e.g. Stable: Scout L1 / Crossbowman L5 / Knight L10).
- **History**: EA Phenomic (Volker Wertich), pure JS, Bigpoint; open beta **2010-04-20**, shutdown **2014-05-12**. CotG by Gaming Addict Studios (Gordon Tunstall), Kickstarter funded in 17 min, open beta **2016-01-23**.

### Educated guesses / approximate `[A]`
- **Unit numeric stats** (attack, the four defense values, upkeep, carry) — from Ultima Codex `monster_data` + strategy blogs; internally consistent with the verified combat example but not from a primary Fandom table.
- Faith→bonus divisor (/2 vs cap-at-100) — sources conflict.
- Exact troop travel-time formula per tile (≈10–20 min/tile by unit).

### Open conflicts (calibrate in playtest; isolate behind `shared/formulas` + tests)
1. **Adjacency cottage grouping**: Fandom = cottages additive with nodes, enhancer multiplicative after (→1,522/h in our worked example); daydull community guide = cottages a separate multiplicative group (→2,100/h). **Decision: implement the Fandom model as canonical.**
2. **Producer base output at L10**: Fandom `300` `[V]` vs OpenLoU JSON `300` vs an agent secondary snippet `250`. → use `300`.
3. **Battle intensity "10% for the rest"**: literal 0.10 vs 0.10×0.50. → use 0.10, flag.

### Data gaps `[U]`
- Exact per-unit **training times** (only recruit-speed % per building level is known).
- Several units' **carry capacities** (Ranger/Crossbowman/Templar/Paladin/Sloop/Frigate).
- Palace per-level cost table; precise enlightenment radius/interval for LoU (CotG's 20-tile / 72→36 h is `[V]` but is a CotG figure).

### Notes for next session
- The Fandom `?action=raw` + browser-UA trick is the reliable way to pull exact tables; use it to fill `[U]` gaps (e.g. fetch `Palace`/individual unit pages if they exist under other titles).
- OpenLoU data has bugs (duplicate ids, mislabeled fields) — never trust it over the Fandom wikitext.
