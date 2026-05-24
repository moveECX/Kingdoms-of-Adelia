# Game Mechanics — Aldermark

> Distilled from the Lord of Ultima wikis + reference implementations. **Mechanics and numbers are facts (not copyrightable); we replicate them.** Names are rebranded per `IP-COMPLIANCE.md` — tables show **Aldermark name (LoU source name)**.
>
> **Confidence tags** on every value:
> `[V]` verified — from a directly fetched primary source (Fandom raw wikitext snapshot in `research/wiki-snapshots/fandom/`, or the LoU `Combat_Mechanics`/`Resources` pages).
> `[A]` approximate — community guide / secondary source (Ultima Codex, strategy blogs) or implied.
> `[U]` unknown — not found; flagged for playtest calibration.
>
> Primary sources: `research/wiki-snapshots/fandom/*.wikitext` (mirrored 2026-05-24). Unit numeric stats are `[A]` (Ultima Codex `monster_data`); building cost/output/time tables are `[V]` (Fandom per-building pages); the combat formula is `[V]` (Fandom `Combat_Mechanics`).

---

## 1. Resources `[V]`

Four **harvested** resources (city-local, capped by storage) + one **pooled** currency:

| Aldermark | LoU | Producer | Enhancer | Node terrain | Notes |
|---|---|---|---|---|---|
| **Timber** | Wood | Woodcutter's Lodge | Sawmill | woods | also +300/h base from the Hall `[V]` |
| **Stone** | Stone | Quarry | Stonemason | rock/hills | |
| **Iron** | Iron | Iron Mine | Foundry | ore deposits/mountains | |
| **Grain** | Food | Farm | Mill | free land (50/40) + **lakes (+50% each)** `[V]` | feeds unit upkeep |
| **Gold** | Gold | Townhouse (tax) | Market/Harbor (tax %) | — | **empire-wide pooled, no cap, not transported** `[V]` |

- Storage cap = Hall + Warehouses (per-resource, see §3). **Gold has no cap.** `[V]`
- **Cellar (Hideout)** stores a protected amount immune to plunder/scouting. `[V]`
- **Magical resource nodes**: one premium node per city, sold in packs — deferred/optional for a self-hosted build. `[V]`
- **Purified/rare resources** (LoU: darkwood/runestone/veritium/trueseed; ours: Heartwood/Wardstone/Starsteel/Truegrain) come from late-game research + **Fame** (≈1 of each per 4,000 Fame `[A]`); gate top-tier units (Barons). Deferred to Phase 5.

---

## 2. Adjacency system — the signature mechanic `[V]`

Each city is a grid; a producer is boosted by its up-to-8 neighbors (orthogonal **and** diagonal). The **verified** Fandom `Resources` rule:

```
production = base(level)
           × (1 + Σ node_bonus + Σ cottage_bonus)   ← additive group
           × (1 + enhancer_bonus)                    ← applied AFTER, multiplicative
```

- **node_bonus**: first adjacent matching node **+50%**, each additional node **+40%**. `[V]`
- **cottage_bonus**: each adjacent Cottage adds its *Manpower Bonus* — L1 **+3%** … L10 **+30%**. `[V]`
- **enhancer_bonus**: at most **one** adjacent enhancer (Sawmill/Stonemason/Mill/Foundry), its *Efficiency Bonus* — L1 **+30%** … L10 **+75%**. A 2nd enhancer on the same producer does nothing. `[V]`
- Lakes boost Farms **+50% each with no diminishing**. `[V]`
- How many nodes a city has is fixed at founding by surrounding region terrain (N/S/E/W tile = +8 nodes, diagonal tile = +4 nodes; mountains→iron, hills→stone, woods→wood, open→lakes). `[V]`

**Worked example** — L10 Woodcutter's Lodge, 3 adjacent wood nodes, 2× L10 Cottage, 1× L10 Sawmill:
```
= 300 × (1 + [0.50+0.40+0.40] + [0.30+0.30]) × (1 + 0.75)
= 300 × (1 + 1.30 + 0.60) × 1.75
= 300 × 2.90 × 1.75  =  1,522.5 timber/h
```

> ⚠️ **Conflict to calibrate `[A]`:** a popular community guide (daydull) treats cottages as a *separate* multiplicative group → `300×2.30×1.75×1.60 = 2,100`. We implement the **Fandom additive-then-multiplicative** model above as canonical, but the formula lives in `shared/formulas/adjacency.ts` behind unit tests so it's trivially re-tunable during playtest.

**Rules of thumb (from the wiki) for layout AI/UX hints:** every producer should touch one enhancer + ≥75% worth of nodes; every enhancer should touch ≥2–3 producers; every cottage should touch ≥3 producers; push Cottages until construction speed is very high. `[V]`

---

## 3. Buildings — full roster + per-level tables

All buildings cap at **level 10**. Costs are `[V]` from Fandom snapshots. "Score" = rank points. Build times shown for the producer/enhancer families; others in their snapshot.

### 3.1 Roster (25 core + towers/traps)

| Aldermark (LoU) | Category | Effect | Prereq (Hall lvl) |
|---|---|---|---|
| Hall (Town Hall) | core | +10 build slots/lvl (max 100); +300 timber/h; storage; 1/city; indestructible | start |
| Woodcutter's Lodge (Woodcutter's Hut) | producer | timber | 1 |
| Cottage | civic | build-speed + producer adjacency | 1 |
| Warehouse | storage | +cap all resources | 1 |
| Quarry | producer | stone | 2 |
| Cellar (Hideout) | storage | hidden, un-plunderable storage | 2 |
| City Wall | defense | +% defense to ground units; indestructible | 2 |
| Farm | producer | grain | 3 |
| Watch House (City Guard House) | military | trains City Guards | 3 |
| Iron Mine | producer | iron | 4 |
| Barracks | military | +army-size cap; +recruit speed to adjacent trainers | 4 |
| Training Yard (Training Ground) | military | infantry | 4 |
| Townhouse | gold | enables tax (gold/h) | 5 |
| Market (Marketplace) | trade | carts (land trade) + tax % | 5 |
| Sawmill | enhancer | +timber producer & storage | 6 |
| Stable (Stables) | military | cavalry | 6 |
| Stonemason | enhancer | +stone producer & storage | 7 |
| Mage Tower (**Moonglow Tower**) | military | casters; resource purification | 7 |
| Mill | enhancer | +grain producer & storage | 8 |
| Citadel (Castle) | special | plunder/assault/siege; +command queue; +army size; 1/city; indestructible | 8 |
| Sanctuary (**Trinsic Temple**) | military | blessed units + leaders (Baron) | 8 |
| Foundry | enhancer | +iron producer & storage | 9 |
| Siege Workshop (Workshop) | military | siege engines | 9 |
| Harbor | trade | ships (sea trade) + tax % | 10 |
| Shipyard | military | naval units | 10 |
| **Towers** (Lookout/Guardian/Ranger/Templar/Ballista) | defense | double matched-unit defense; don't count to build cap | — |
| **Traps** (Pitfall/Barricade/Arcane/Camouflage) | defense | neutralize ≤50% of matched attacker type; outer ring; don't count to cap | — |

### 3.2 Hall (Town Hall) `[V]`
| Lvl | Slots | Timber/h | Storage | Cost T | Cost S | Build |
|--:|--:|--:|--:|--:|--:|--|
|1|10|300|5,000|–|–|–|
|2|20|300|7,000|200|–|25 s|
|3|30|300|10,000|500|100|40 s|
|4|40|300|15,000|1,000|300|1 m 40 s|
|5|50|300|24,000|3,000|1,500|30 m|
|6|60|300|35,000|8,000|4,000|2 h 30 m|
|7|70|300|50,000|15,000|10,000|8 h 20 m|
|8|80|300|80,000|30,000|25,000|16 h 40 m|
|9|90|300|125,000|60,000|60,000|26 h|
|10|100|300|175,000|120,000|120,000|37 h 20 m|

### 3.3 Producer family — Woodcutter's Lodge / Quarry / Iron Mine `[V]`
Identical cost/output/time across all three (output is timber/stone/iron respectively):
| Lvl | Output/h | Cost T | Cost S | Build |
|--:|--:|--:|--:|--|
|1|20|50|–|15 s|
|2|40|200|–|54 s|
|3|60|400|200|6 m|
|4|85|1,400|600|45 m|
|5|110|3,500|1,500|1 h 41 m|
|6|140|6,000|3,000|3 h 23 m|
|7|175|10,000|5,000|6 h 15 m|
|8|210|16,000|8,000|9 h 57 m|
|9|250|25,000|13,000|14 h 58 m|
|10|300|38,000|20,000|22 h 42 m|

### 3.4 Farm `[V]` (same costs/times as §3.3; different output curve)
Grain/h by level: **5, 8, 15, 20, 30, 45, 75, 120, 200, 300**.

### 3.5 Enhancer family — Sawmill / Stonemason / Mill / Foundry `[V]`
Identical across all four (efficiency → matched producer; storage → matched resource):
| Lvl | Efficiency | Storage bonus | Cost T | Cost S | Build |
|--:|--:|--:|--:|--:|--|
|1|+30%|+20%|60|60|20 s|
|2|+35%|+40%|150|150|1 m 48 s|
|3|+40%|+60%|350|350|12 m|
|4|+45%|+80%|1,100|1,100|1 h 30 m|
|5|+50%|+100%|2,700|2,700|3 h 23 m|
|6|+55%|+120%|5,000|5,000|6 h 45 m|
|7|+60%|+140%|8,500|8,500|12 h 18 m|
|8|+65%|+160%|13,500|13,500|19 h 53 m|
|9|+70%|+180%|21,500|21,500|29 h 56 m|
|10|+75%|+200%|33,000|33,000|45 h 23 m|

### 3.6 Cottage `[V]`
| Lvl | Build speed | Manpower (adj. producer bonus) | Cost T | Cost S |
|--:|--:|--:|--:|--:|
|1|+4%|+3%|–|50|
|5|+35%|+15%|200|1,000|
|10|+100%|+30%|12,000|17,000|

(Full curve in snapshot. Build-speed is **city-wide and additive across cottages**; manpower is the per-adjacency producer bonus used in §2.)

### 3.7 Storage, gold, trade, defense (key per-level values) `[V]`
- **Warehouse** storage: 2.5k,5k,9k,16k,26k,42k,65k,100k,145k,**200k**. Cost (T/S) 60/– … 20,000/13,000.
- **Cellar (Hideout)** hidden storage: 500 … **15,000** (stone-only cost 50 … 8,000).
- **Townhouse** gold/h: 25,50,75,100,130,170,210,260,320,**400**. Cost ramps to 29k/29k.
- **Market** carts: 1,4,10,20,30,50,70,105,145,**200**; tax +2%…**+20%**.
- **Harbor** ships: 1,2,4,6,9,12,15,19,24,**30**; tax +5%…**+50%**.
- **City Wall** combat bonus: +1,+3,+6,+10,+15,+20,+26,+33,+41,**+50%** (stone-only cost to 200,000).
- **Barracks** army-size: +10,+30,+60,+100,+160,+240,+350,+500,+700,**+1000**; recruit speed +1%…**+25%**.
- **Citadel (Castle)** command queue: **+1 per level (max +10)**; max army size +20%…**+300%**; stone-only cost 20,000…200,000 (total **835,000**).

### 3.8 Trainers — unit unlocks by level `[V]`
Recruit-speed scales +5%→+150% (L1→L10) for all; **adjacent Barracks adds speed** (Watch House excepted). Unit unlock levels:
| Building | L1 | mid | L10 |
|---|---|---|---|
| Watch House | City Guard | — | — |
| Training Yard | Berserker | Ranger (L4) | Guardian |
| Stable | Scout | Crossbowman (L5) | Knight |
| Mage Tower | Mage | Warlock (L7) | — |
| Sanctuary | Templar | Paladin (L6) | Baron |
| Siege Workshop | Ram | Ballista (L6) | Catapult |
| Shipyard | Sloop | Frigate (L6) | War Galleon |

### 3.9 Towers & traps `[V]`
- **Towers** (built inside city, don't count toward the 100-building cap) **double** the defense of up to their capacity of one matched unit type; City Guards fill empty capacity. L10 capacity: Ranger/Guardian/Templar Tower **2,000 TS**; **Ballista Tower 2,500**; **Lookout Tower 500 scouts + 10 h attack warning**. Stone-only cost to 58,000.
- **Traps** (outer wall ring, don't count to cap) **neutralize** up to their capacity of one matched attacker type (neutralized = deals no damage), max **50%** of that type. L10 capacity **1,000 TS** (Camouflage vs naval ≈ 2 War Galleons). All four share cost (T/S to 16,000/48,000): Pitfall→infantry, Barricade→cavalry, Arcane→magic, Camouflage→naval.

---

## 4. Units `[A]` (stats), `[V]` (unlocks/roles)

Defense is **type-specific**, ordered **vs Infantry / Cavalry / Magic / Artillery**. Carry = plunder capacity. Upkeep is grain/day. Stats from Ultima Codex `monster_data` (community), so `[A]`; cross-checked against the combat example which uses Ranger def-vs-inf 40 / def-vs-cav 10 and Guardian def-vs-cav 50 — consistent.

| Unit | Role/type | Atk | Def I/C/M/A | Upkeep | Carry | Trainer | Cost (T/S/Fe/G) |
|---|---|--:|---|--:|--:|---|---|
| City Guard | defensive special | 10 | 10/10/10/10 | 2 | – | Watch House | 100/–/–/– |
| Berserker | offensive infantry | 50 | 15/12/10/15 | 6 | 10 | Training Yard | –/–/150/– |
| Ranger | defensive infantry/missile | 30 | 40/10/25/15 | 3 | – | Training Yard | 160/–/–/– |
| Guardian | defensive infantry (anti-cav) | 10 | 30/50/20/15 | 3 | 20 | Training Yard | –/–/140/40 |
| Scout | recon cavalry | 10 | 10/10/10/10 | 5 | – | Stable | –/–/40/120 |
| Crossbowman | defensive (anti-cav) | 40 | 40/90/30/40 | – | – | Stable | 150/–/–/200 |
| Knight | offensive cavalry | 90 | 40/30/20/40 | 25 | 15–20 | Stable | –/–/250/100 |
| Mage | offensive caster | 70 | 15/10/30/15 | 5 | 5 | Mage Tower | –/–/50/150 |
| Warlock | offensive caster | 120 | 30/20/50/40 | 20 | 5 | Mage Tower | –/–/100/350 |
| Templar | defensive blessed (anti-magic) | 25 | 20/30/50/15 | – | – | Sanctuary | –/–/90/100 |
| Paladin | defensive blessed cavalry | 60 | 50/20/90/40 | – | – | Sanctuary | –/–/200/160 |
| Marshal (Baron) | leader (founds/captures cities) | 10 | 100/50/20/10 | – | – | Sanctuary L10 | –/–/50k/100k |
| Ram | siege | 50 (250 vs structures) | 20/20/20/50 | – | – | Siege Workshop | 500/–/300/– |
| Ballista | defensive siege (anti-artillery) | 50 | 200/100/200/400 | – | – | Siege Workshop | 400/–/600/– |
| Catapult | siege (anti-building) | 150 (250 vs buildings) | 100/100/200/50 | – | – | Siege Workshop | 300/600/200/– |
| Sloop | defensive naval | 1,200 | 4500/4500/2000/6000 | – | – | Shipyard | 6000/–/4000/2000 |
| Frigate | naval transport (≤500 TS) | 3,000 | 4000/4000/2000/2000 | – | troops | Shipyard L6 | 15000/–/5000/5000 |
| War Galleon | offensive naval (=400 TS) | 12,000 (4,000 vs structures) | 5000/5000/2500/6000 | 2,500 | 3,000 | Shipyard L10 | 30000/–/10000/20000 |
| Dragon | epic (20 TS) | 700,000 | huge | 75,000 | – | Dragon's Lair (egg) | rare |

**Counters** (from defense columns): Rangers/Ballistae vs infantry; Guardians/Crossbowmen vs cavalry; Templars/Paladins/Ballistae vs magic; Ballistae vs artillery. `[A]`

---

## 5. Combat resolution `[V]`

From Fandom `Combat_Mechanics` (snapshot). Deterministic; lives in `shared/formulas/combat.ts`.

1. **Attack power** `a_tot = Σ(atk_i × qty_i)`.
2. **Attention split**: defenders distribute across attacker types **proportionally to each type's attack share** `a_i / a_tot`.
3. **Defense power** per attacker type `d_i = Σ(def_of_defender_vs_that_type × defenders_assigned)`; `d_tot = Σ d_i`. (Defense column chosen by the *attacker's* type.)
4. **Victor**: attacker wins iff `a_tot > d_tot`.
5. **Casualties** (× battle intensity `I`):
   - **Loser** side loses `√(ratio) × I`; **winner** side loses `ratio × I`.
   - Defenders (uniform %): win→`(a_tot/d_tot)·I`, lose→`√(a_tot/d_tot)·I`.
   - Attackers (per type): win→`(d_i/a_i)·I`, lose→`√(d_i/a_i)·I`.
6. **Battle intensity `I`**: assault/scout/boss = **0.50**; attacker if boss dies = 0.10; **defender of a plunder = 0.01**; siege wave / others ≈ **0.10**. `[V]` (the "10% for the rest" wording is `[A]`).

**Verified worked example** — 1,000 Berserkers (atk 50) + 1,000 Knights (atk 90) vs 1,400 Rangers + 1,400 Guardians, assault:
`a_tot=140,000`; `d_tot=89,000` → attacker wins. Defenders lose `0.5·√(140/89)=62.7%`. Berserkers lose `0.5·(35,000/50,000)=35%`; Knights lose `0.5·(54,000/90,000)=30%`.

**Modifiers:**
- **City Wall** +1…**+50%** defense to ground units (not naval). `[V]`
- **Towers** double matched-unit defense (capacity-limited). **Traps** neutralize ≤50% of a matched attacker type. `[V]`
- **Night protection** (10pm–10am server): attacker offense **−40%**; siege claim capped 6%/wave (vs 10% day); excludes PvE. `[A]`

**Attack types** (need a Citadel): Scout, Plunder (loot = min(available, surviving carry capacity); buildings unharmed), Assault (1 wave, 5× a siege wave's damage), Siege (hourly waves; a **Marshal/Baron** claims **10%/wave day, 6%/night**; 100% = capture; Marshal death resets to 0), Support. Rams bust walls; Catapults & War Galleons reduce building levels. `[V]/[A]`

---

## 6. World map & cities

- **World** `[V]`: 6×6 = **36 continents**, each **100×100** squares (incl. ocean) → ~600×600 global; coordinates `x:y` (000:000–599:599). Continents open as population grows. *(Aldermark uses a single shared world; we keep the continent/coordinate model but one world.)*
- **City grid** `[V]`: 9×9 with the Hall in the center; **10 slots/Hall level, max 100 buildings**; Palace needs a free **3×3** block; 1 each of Hall/Citadel/City Wall per city. Internal node terrain fixed at founding.
- **Founding a city** `[A]`: send a **Marshal (Baron)** to an empty/lawless slot; cost ≈ **100k timber + 100k stone + 25k iron + 25k grain + 250 carts (or 25 ships)**; new cities get a **7-day protection** shield.
- **Titles → max cities** `[V]`: Sir/Knight/Baron = 1 · Earl = 2 · Marquess = 4 · Prince = 8 · Duke = 16 · King = 40 · Emperor = 80 (scales via research). Each Citadel ≈ 4 title levels; titles also set a **Mana** pool/regen (special actions).
- **Travel** `[V]`: carts 10 min/tile (cap 1,000); ships 5 min/tile + 1 h load each way (cap 10,000). Troop travel ≈ 10–20 min/tile by type `[A]`. Inter-continental via **Moongates/Portals** (one activates ~weekly for 24 h) `[V]`.

---

## 7. PvE — dungeons & bosses `[V]`

- **Dungeons** by terrain: Forest (Spiders→Thieves→Centaurs→Trolls), Hill (Skeletons→Ghouls→Gargoyles→Daemons), Mountain (Orcs→Troglodytes→Ettins→Minotaurs), Sea (Pirate ships). Fill 0→100% over ~2 weeks; higher completion = more tiers + more loot.
- **Loot cap by level (L1→L10)**: 320, 977, 2,000, 15,488, 30,000, 56,850, 117,175, 198,205, 356,970, **441,375**. Completion multiplier 50%→×1.5, 75%→×2, 100%→×3. Gold = % of loot, 200% (L1) → 25% (L10).
- **Bosses** (Dragon/Hydra/Moloch/Kraken, 10 levels): loot 500→**600,000**; artifacts only on kill; **not killing the boss = 5× losses**. ~1 h prep + travel + 1 h unload.

*(Aldermark renames creatures to original mythology; mechanics identical.)*

---

## 8. Trade & alliances

- **Trade** `[V]`: see §6 travel. Market enables land trade + boosts adjacent Townhouse tax; Harbor enables sea trade + tax. Player marketplace for resource↔gold exchange.
- **Alliances** `[V]`: max **100** members; ranks (Leader/Officer/.../Novice) with graded permissions; diplomacy = Allied / NAP / Enemy; private forum + announcements + event log. Alliance-wide **Faith** bonuses (§9).

---

## 9. Endgame & victory `[V]`

- **Eight Virtues** (LoU): Compassion, Honesty, Honor, Humility, Justice, Sacrifice, Spirituality, Valor — each gives an alliance-wide combat/speed/economy bonus. *(Aldermark renames to original mythology; keeps 8.)*
- **Shrines** (8/continent) activate over time; an active shrine **enlightens** nearby **castled cities of an alliance member**, letting that city **build/upgrade one Palace per enlightenment**.
- **Palace**: 3×3 footprint, 1/city, max L10, of the enlightening shrine's virtue. Palaces feed the alliance's **Faith** per virtue; **bonus = Faith ÷ 2, capped 100% (at 200 Faith)** `[A]`. Active shrine also grants +10% army damage to its controlling alliance.
- **Victory (LoU, our model)**: **an alliance wins when it collectively owns a level-10 Palace of all eight virtues** → world ends; binary first-to-complete. `[V]`
- **CotG variant** (reference): Temples-of-8-Gods instead of Palaces; gold/silver/bronze **crowns** for 1st/2nd/3rd; world stays open 30 days after 3rd. We adopt the simpler **LoU single-winner** model for Phase 5, noting the crown variant as a possible tweak.

---

## 10. Source & confidence summary

| Area | Confidence | Source |
|---|---|---|
| Building cost/output/build-time per level | **[V]** | Fandom per-building wikitext snapshots |
| Adjacency formula & node/cottage/enhancer % | **[V]** | Fandom `Resources` |
| Combat formula + intensity + worked example | **[V]** | Fandom `Combat_Mechanics` |
| Map size, city grid, titles, victory, trade, dungeons | **[V]** | Fandom `World_Setup`/`Cities`/`Palaces`/`Shrine`/`Dungeons` + Ultima Codex |
| Unit numeric stats (atk/def/upkeep/carry) | **[A]** | Ultima Codex `monster_data` + strategy blogs |
| Exact unit training times; some carry capacities | **[U]** | not found — calibrate in playtest |
| Adjacency cottage grouping (additive vs multiplicative) | **[A]** | Fandom vs daydull conflict — model behind tests |

Append newly verified/overturned values to `RESEARCH-LOG.md` with date + source.
