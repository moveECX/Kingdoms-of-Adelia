# IP Compliance

> **Project working title:** *Aldermark* (provisional — centralized in one constant; see `shared/constants/`. Renaming later is a find/replace.)
> **Theme:** Original-mythology medieval — an invented frontier realm of feuding city-states. No real-world history, no Ultima-series setting.

This project is a **clean-room reimplementation** of the *gameplay* of Lord of Ultima (EA Phenomic) and Crown of the Gods (Gaming Addict Studios). Both are out of active development. We replicate **mechanics**; we invent **everything expressive**.

## 1. The governing principle

- ✅ **Game mechanics, rules, systems, formulas, and balance numbers are NOT copyrightable.** We may freely replicate adjacency math, combat resolution, production curves, build times, and the *behavior* of the game.
- ❌ **Expression IS copyrightable.** Names, art, sprites, tiles, icons, sounds, music, UI screenshots, story/lore text, and specific tooltip prose are off-limits.
- ❌ **Trademarks** (game titles, branded proper nouns) must not be used in our code, UI, docs, or marketing.

When in doubt: **reimplement the rule, rewrite the words, redraw the art.**

## 2. Banned proper nouns — never appear anywhere

Do **not** use these in code identifiers, UI, docs, commit messages, asset filenames, or marketing:

- Game titles: **"Lord of Ultima"**, **"Crown of the Gods"**, "LoU", "CotG" (acceptable only inside `research/` analysis when *referring to the source*, never in product).
- Ultima-series proper nouns: **"Ultima"**, **"Sosaria"**, **"Britannia"**, **"Caledonia"**, **"Moonglow"**, **"Trinsic"**, **"Yew"**, **"Minoc"**, **"Skara Brae"**, **"Vesper"**, **"Magincia"**, **"Jhelom"**, **"Cove"**, and any other Ultima place/character name.
- Company/brand names in product context: "EA", "Electronic Arts", "Phenomic", "Gaming Addict Studios".

⚠️ **Two banned names appear in the OpenLoU reference data** and have been mapped below: **"Moonglow Tower"** and **"Trinsic Temple"**. They must be renamed in all our data and code.

## 3. Assets — strictly original

- **Zero assets from `FelixLeChat/LordOfUltima`.** Its README admits the art is *"property of EA."* Its 30 MB of `.PNG`/`.mp3` are off-limits for any purpose — not even as placeholders or drawing references. The repo stays gitignored under `research/reference-repos/`.
- **No screenshots** of the original games used as texture, trace source, or "reference while drawing."
- All art (even greybox/placeholder) is **authored originally** for this project: SVG UI icons, original PNG/WebP tiles. Placeholder art = simple original colored shapes, never derived.
- Audio (if any) is original or properly licensed (CC0/CC-BY with attribution), never ripped.

## 4. Code licensing boundary

- **OpenLoU is GPLv3 (copyleft).** We do **not** copy or derive from its Go source or JSON files — that would relicense us. We only transcribe **numeric values** (facts) after verifying them against the wikis.
- **FelixLeChat has no license → all rights reserved.** We do **not** reuse any of its code.
- Our own project license: **TBD by user** (recommended: MIT for self-hosted, or AGPLv3 if any future public deployment should stay open). Tracked in `CLAUDE.md`.

## 5. Rename map — LoU/OpenLoU → Aldermark

Canonical names live in `shared/constants/`. `[REQUIRED]` = renaming a banned/IP noun; others are theme polish.

### Resources (1:1 with LoU, generic medieval terms — safe)
| LoU | Aldermark |
|---|---|
| Wood | **Timber** |
| Stone | **Stone** |
| Iron / Ore | **Iron** |
| Food | **Grain** |
| Gold | **Gold** |
| (rare resources) | **Heartwood**, **Wardstone**, **Starsteel**, **Truegrain** *(provisional; confirm real LoU rare-resource set via research)* |
| Premium currency (OpenLoU "diamonds") | **Crowns** *(premium currency is optional/deferred for a self-hosted build)* |

### Buildings
| LoU / OpenLoU | Aldermark | Note |
|---|---|---|
| Town Hall | **Hall** | core building |
| Woodcutter's Hut | **Woodcutter's Lodge** | timber producer |
| Sawmill | **Sawmill** | timber enhancer |
| Quarry | **Quarry** | stone producer |
| Stonemason | **Stonemason** | stone enhancer |
| Iron / Ore Mine | **Iron Mine** | iron producer |
| Foundry | **Foundry** | iron enhancer |
| Farm | **Farm** | grain producer |
| Mill | **Mill** | grain enhancer |
| Cottage | **Cottage** | construction speed + producer adjacency |
| Townhouse | **Townhouse** | tax/gold income |
| Warehouse | **Warehouse** | resource storage |
| Hideout | **Cellar** | hidden (un-plunderable) storage |
| Marketplace | **Market** | land trade + tax |
| Harbor | **Harbor** | sea trade + tax |
| City Guard House | **Watch House** | trains defensive guards |
| Barracks | **Barracks** | army-size cap + recruit-speed adjacency |
| Training Ground | **Training Yard** | infantry |
| Stable | **Stable** | cavalry |
| Workshop | **Siege Workshop** | siege engines |
| Shipyard | **Shipyard** | naval |
| **Moonglow Tower** | **Mage Tower** | casters — **[REQUIRED]** (Moonglow = Ultima) |
| **Trinsic Temple** | **Sanctuary** | blessed units/leaders — **[REQUIRED]** (Trinsic = Ultima) |
| Castle | **Citadel** | plunder/siege/capture + command queue |
| City Wall | **City Wall** | defense bonus |
| Palace (endgame) | **Seat of Power** | *confirm via research* |
| Temple (endgame) | **Wardstone Shrine** | *confirm via research* |

### Units & endgame
Unit and victory-structure names are finalized in `GAME-MECHANICS.md` once the unit/endgame research lands. Proposed neutral scheme (no IP nouns): Militia, Spearman, Swordsman, Archer, Crossbowman, Light/Heavy Cavalry, Battering Ram, Catapult, Ballista, Mage, Warlock, Templar (blessed), Marshal (leader), Scout, Cog/Galley/Warship (naval). None of these are Ultima nouns; safe to use.

## 6. Theme & setting (original)

*Aldermark* is a fractured continent of independent holdings emerging from a long collapse. Players are **Wardens** who found and grow city-states by laying out buildings to exploit **adjacency**, raid monster-held **ruins** for rare materials, trade along land and sea routes, and contest ancient **Wardstone shrines** for dominion. The tone is grounded low-fantasy medieval — original mythology, not Arthurian or Ultima lore. All lore text is written fresh; no source prose is reused.

## 7. Borderline-decision log

| Decision | Ruling | Reasoning |
|---|---|---|
| Keep generic building names ("Barracks", "Quarry", "Harbor") | ✅ Allowed | Common English words / generic medieval functions; not protectable as marks. |
| Replicate LoU's exact adjacency percentages & cost curves | ✅ Allowed | Numbers/mechanics are facts, not expression. |
| Use OpenLoU's `db.sql`/JSON files directly | ❌ Avoided | GPLv3 derivative risk; we re-derive our own schema/data. |
| Reuse any FelixLeChat image/sound | ❌ Banned | EA-owned, author-admitted. |
| Reproduce LoU tooltip text verbatim | ❌ Banned | Copyrightable prose; we write original copy. |
| Use the word "Ultima" in product | ❌ Banned | Trademarked franchise. OK only in `research/` when citing the source. |

Append any new borderline calls here as they arise.
