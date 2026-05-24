# Spielmechaniken — Kingdoms of Adelia

> Destilliert aus den Lord-of-Ultima-Wikis + Referenz-Implementierungen. **Mechaniken und Zahlen sind Fakten (nicht urheberrechtlich schützbar); wir replizieren sie.** Namen sind gemäß `IP-COMPLIANCE.md` umbenannt — Tabellen zeigen **Adelia-Name (LoU-Quellname)**.
>
> **Confidence-Tags** an jedem Wert:
> `[V]` verified — aus einer direkt geladenen Primärquelle (Fandom-Rohwikitext-Snapshot in `research/wiki-snapshots/fandom/` bzw. die LoU-Seiten `Combat_Mechanics`/`Resources`).
> `[A]` approximate — Community-Guide / Sekundärquelle (Ultima Codex, Strategie-Blogs) oder impliziert.
> `[U]` unknown — nicht gefunden; für Playtest-Kalibrierung markiert.
>
> Primärquellen: `research/wiki-snapshots/fandom/*.wikitext` (gespiegelt 2026-05-24). Numerische Einheiten-Stats sind `[A]` (Ultima Codex `monster_data`); Gebäude-Kosten/-Output/-Zeit-Tabellen sind `[V]` (Fandom-Gebäudeseiten); die Kampfformel ist `[V]` (Fandom `Combat_Mechanics`).

---

## 1. Ressourcen `[V]`

Vier **geerntete** Ressourcen (stadt-lokal, durch Lager gedeckelt) + eine **gepoolte** Währung:

| Adelia | LoU | Produzent | Verstärker | Knoten-Terrain | Hinweise |
|---|---|---|---|---|---|
| **Timber** (Holz) | Wood | Woodcutter's Lodge | Sawmill | Wälder | zusätzlich +300/h Basis aus der Hall `[V]` |
| **Stone** | Stone | Quarry | Stonemason | Fels/Hügel | |
| **Iron** | Iron | Iron Mine | Foundry | Erzvorkommen/Berge | |
| **Grain** | Food | Farm | Mill | freies Land (50/40) + **Seen (+50% je)** `[V]` | speist Einheiten-Unterhalt |
| **Gold** | Gold | Townhouse (Steuer) | Market/Harbor (Steuer-%) | — | **reichsweit gepoolt, kein Cap, nicht transportiert** `[V]` |

- Lager-Cap = Hall + Warehouses (pro Ressource, siehe §3). **Gold hat kein Cap.** `[V]`
- **Cellar (Hideout)** lagert einen geschützten, vor Plünderung/Spähung sicheren Betrag. `[V]`
- **Magische Ressourcen-Knoten**: ein Premium-Knoten pro Stadt, im Paket verkauft — für Selbsthosting zurückgestellt/optional. `[V]`
- **Veredelte/seltene Ressourcen** (LoU: darkwood/runestone/veritium/trueseed; bei uns: Heartwood/Wardstone/Starsteel/Truegrain) stammen aus Spätspiel-Forschung + **Fame** (≈1 je Typ pro 4.000 Fame `[A]`); gaten Top-Einheiten (Barone). Auf Phase 5 zurückgestellt.

---

## 2. Adjazenz-System — die Signatur-Mechanik `[V]`

Jede Stadt ist ein Raster; ein Produzent wird von seinen bis zu 8 Nachbarn verstärkt (orthogonal **und** diagonal). Die **verifizierte** Fandom-`Resources`-Regel:

```
production = base(level)
           × (1 + Σ node_bonus + Σ cottage_bonus)   ← additive Gruppe
           × (1 + enhancer_bonus)                     ← danach angewandt, multiplikativ
```

- **node_bonus**: erster angrenzender passender Knoten **+50%**, jeder weitere Knoten **+40%**. `[V]`
- **cottage_bonus**: jede angrenzende Cottage addiert ihren *Manpower-Bonus* — L1 **+3%** … L10 **+30%**. `[V]`
- **enhancer_bonus**: höchstens **ein** angrenzender Verstärker (Sawmill/Stonemason/Mill/Foundry), dessen *Efficiency-Bonus* — L1 **+30%** … L10 **+75%**. Ein 2. Verstärker am selben Produzenten bringt nichts. `[V]`
- Seen verstärken Farms **+50% je, ohne Abschwächung**. `[V]`
- Wie viele Knoten eine Stadt hat, ist bei Gründung durch das umliegende Regionsterrain fixiert (N/S/O/W-Tile = +8 Knoten, Diagonal-Tile = +4 Knoten; Berge→Eisen, Hügel→Stein, Wald→Holz, offen→Seen). `[V]`

**Durchgerechnetes Beispiel** — L10 Woodcutter's Lodge, 3 angrenzende Holzknoten, 2× L10 Cottage, 1× L10 Sawmill:
```
= 300 × (1 + [0.50+0.40+0.40] + [0.30+0.30]) × (1 + 0.75)
= 300 × (1 + 1.30 + 0.60) × 1.75
= 300 × 2.90 × 1.75  =  1.522,5 Holz/h
```

> ⚠️ **Zu kalibrierender Konflikt `[A]`:** ein populärer Community-Guide (daydull) behandelt Cottages als *separate* multiplikative Gruppe → `300×2.30×1.75×1.60 = 2.100`. Wir implementieren das **Fandom-Modell „additiv-dann-multiplikativ"** als kanonisch, aber die Formel lebt in `shared/formulas/adjacency.ts` hinter Unit-Tests, ist also trivial nachjustierbar.

**Faustregeln (aus dem Wiki) für Layout-Hilfen/UX:** jeder Produzent sollte einen Verstärker + ≥75% an Knoten berühren; jeder Verstärker ≥2–3 Produzenten; jede Cottage ≥3 Produzenten; Cottages hochziehen, bis das Bautempo sehr hoch ist. `[V]`

---

## 3. Gebäude — vollständige Liste + Tabellen pro Stufe

Alle Gebäude enden bei **Stufe 10**. Kosten sind `[V]` aus den Fandom-Snapshots. „Score" = Rangpunkte. Bauzeiten für die Produzenten-/Verstärker-Familien gezeigt; übrige im jeweiligen Snapshot.

### 3.1 Liste (25 Kern + Türme/Fallen)

| Adelia (LoU) | Kategorie | Effekt | Voraussetzung (Hall-Stufe) |
|---|---|---|---|
| Hall (Town Hall) | Kern | +10 Bauslots/Stufe (max 100); +300 Holz/h; Lager; 1/Stadt; unzerstörbar | Start |
| Woodcutter's Lodge (Woodcutter's Hut) | Produzent | Holz | 1 |
| Cottage | Zivil | Bautempo + Produzenten-Adjazenz | 1 |
| Warehouse | Lager | +Cap alle Ressourcen | 1 |
| Quarry | Produzent | Stein | 2 |
| Cellar (Hideout) | Lager | verstecktes, unplünderbares Lager | 2 |
| City Wall | Verteidigung | +% Verteidigung für Bodeneinheiten; unzerstörbar | 2 |
| Farm | Produzent | Getreide | 3 |
| Watch House (City Guard House) | Militär | bildet City Guards aus | 3 |
| Iron Mine | Produzent | Eisen | 4 |
| Barracks | Militär | +Armeegrößen-Cap; +Rekrutiertempo angrenzender Trainer | 4 |
| Training Yard (Training Ground) | Militär | Infanterie | 4 |
| Townhouse | Gold | ermöglicht Steuer (Gold/h) | 5 |
| Market (Marketplace) | Handel | Karren (Landhandel) + Steuer-% | 5 |
| Sawmill | Verstärker | +Holz-Produzent & -Lager | 6 |
| Stable (Stables) | Militär | Kavallerie | 6 |
| Stonemason | Verstärker | +Stein-Produzent & -Lager | 7 |
| Mage Tower (**Moonglow Tower**) | Militär | Magier; Ressourcen-Veredelung | 7 |
| Mill | Verstärker | +Getreide-Produzent & -Lager | 8 |
| Citadel (Castle) | Spezial | Plündern/Belagern; +Befehls-Queue; +Armeegröße; 1/Stadt; unzerstörbar | 8 |
| Sanctuary (**Trinsic Temple**) | Militär | gesegnete Einheiten + Anführer (Baron) | 8 |
| Foundry | Verstärker | +Eisen-Produzent & -Lager | 9 |
| Siege Workshop (Workshop) | Militär | Belagerungsgerät | 9 |
| Harbor | Handel | Schiffe (Seehandel) + Steuer-% | 10 |
| Shipyard | Militär | Marine-Einheiten | 10 |
| **Türme** (Lookout/Guardian/Ranger/Templar/Ballista) | Verteidigung | verdoppeln Verteidigung der passenden Einheit; zählen nicht zum Baulimit | — |
| **Fallen** (Pitfall/Barricade/Arcane/Camouflage) | Verteidigung | neutralisieren ≤50% des passenden Angreifertyps; Außenring; zählen nicht zum Limit | — |

### 3.2 Hall (Town Hall) `[V]`
| Stufe | Slots | Holz/h | Lager | Kosten T | Kosten S | Bauzeit |
|--:|--:|--:|--:|--:|--:|--|
|1|10|300|5.000|–|–|–|
|2|20|300|7.000|200|–|25 s|
|3|30|300|10.000|500|100|40 s|
|4|40|300|15.000|1.000|300|1 m 40 s|
|5|50|300|24.000|3.000|1.500|30 m|
|6|60|300|35.000|8.000|4.000|2 h 30 m|
|7|70|300|50.000|15.000|10.000|8 h 20 m|
|8|80|300|80.000|30.000|25.000|16 h 40 m|
|9|90|300|125.000|60.000|60.000|26 h|
|10|100|300|175.000|120.000|120.000|37 h 20 m|

### 3.3 Produzenten-Familie — Woodcutter's Lodge / Quarry / Iron Mine `[V]`
Identische Kosten/Output/Zeit über alle drei (Output ist Holz/Stein/Eisen):
| Stufe | Output/h | Kosten T | Kosten S | Bauzeit |
|--:|--:|--:|--:|--|
|1|20|50|–|15 s|
|2|40|200|–|54 s|
|3|60|400|200|6 m|
|4|85|1.400|600|45 m|
|5|110|3.500|1.500|1 h 41 m|
|6|140|6.000|3.000|3 h 23 m|
|7|175|10.000|5.000|6 h 15 m|
|8|210|16.000|8.000|9 h 57 m|
|9|250|25.000|13.000|14 h 58 m|
|10|300|38.000|20.000|22 h 42 m|

### 3.4 Farm `[V]` (gleiche Kosten/Zeiten wie §3.3; andere Output-Kurve)
Getreide/h pro Stufe: **5, 8, 15, 20, 30, 45, 75, 120, 200, 300**.

### 3.5 Verstärker-Familie — Sawmill / Stonemason / Mill / Foundry `[V]`
Identisch über alle vier (Effizienz → passender Produzent; Lager → passende Ressource):
| Stufe | Effizienz | Lager-Bonus | Kosten T | Kosten S | Bauzeit |
|--:|--:|--:|--:|--:|--|
|1|+30%|+20%|60|60|20 s|
|2|+35%|+40%|150|150|1 m 48 s|
|3|+40%|+60%|350|350|12 m|
|4|+45%|+80%|1.100|1.100|1 h 30 m|
|5|+50%|+100%|2.700|2.700|3 h 23 m|
|6|+55%|+120%|5.000|5.000|6 h 45 m|
|7|+60%|+140%|8.500|8.500|12 h 18 m|
|8|+65%|+160%|13.500|13.500|19 h 53 m|
|9|+70%|+180%|21.500|21.500|29 h 56 m|
|10|+75%|+200%|33.000|33.000|45 h 23 m|

### 3.6 Cottage `[V]`
| Stufe | Bautempo | Manpower (Produzenten-Bonus) | Kosten T | Kosten S |
|--:|--:|--:|--:|--:|
|1|+4%|+3%|–|50|
|5|+35%|+15%|200|1.000|
|10|+100%|+30%|12.000|17.000|

(Volle Kurve im Snapshot. Bautempo ist **stadtweit und additiv über Cottages**; Manpower ist der Adjazenz-Bonus pro Produzent aus §2.)

### 3.7 Lager, Gold, Handel, Verteidigung (zentrale Werte pro Stufe) `[V]`
- **Warehouse**-Lager: 2.500, 5.000, 9.000, 16.000, 26.000, 42.000, 65.000, 100.000, 145.000, **200.000**. Kosten (T/S) 60/– … 20.000/13.000.
- **Cellar (Hideout)** verstecktes Lager: 500 … **15.000** (nur Stein-Kosten 50 … 8.000).
- **Townhouse** Gold/h: 25, 50, 75, 100, 130, 170, 210, 260, 320, **400**. Kosten bis 29k/29k.
- **Market** Karren: 1, 4, 10, 20, 30, 50, 70, 105, 145, **200**; Steuer +2%…**+20%**.
- **Harbor** Schiffe: 1, 2, 4, 6, 9, 12, 15, 19, 24, **30**; Steuer +5%…**+50%**.
- **City Wall** Kampfbonus: +1, +3, +6, +10, +15, +20, +26, +33, +41, **+50%** (nur Stein-Kosten bis 200.000).
- **Barracks** Armeegröße: +10, +30, +60, +100, +160, +240, +350, +500, +700, **+1000**; Rekrutiertempo +1%…**+25%**.
- **Citadel (Castle)** Befehls-Queue: **+1 pro Stufe (max +10)**; max Armeegröße +20%…**+300%**; nur Stein-Kosten 20.000…200.000 (gesamt **835.000**).

### 3.8 Trainer — Einheiten-Freischaltungen nach Stufe `[V]`
Rekrutiertempo skaliert +5%→+150% (L1→L10) für alle; **angrenzende Barracks erhöht Tempo** (Watch House ausgenommen). Freischalt-Stufen:
| Gebäude | L1 | Mitte | L10 |
|---|---|---|---|
| Watch House | City Guard | — | — |
| Training Yard | Berserker | Ranger (L4) | Guardian |
| Stable | Scout | Crossbowman (L5) | Knight |
| Mage Tower | Mage | Warlock (L7) | — |
| Sanctuary | Templar | Paladin (L6) | Baron |
| Siege Workshop | Ram | Ballista (L6) | Catapult |
| Shipyard | Sloop | Frigate (L6) | War Galleon |

### 3.9 Türme & Fallen `[V]`
- **Türme** (in der Stadt gebaut, zählen nicht zum 100-Gebäude-Limit) **verdoppeln** die Verteidigung von bis zu ihrer Kapazität eines passenden Einheitentyps; City Guards füllen freie Kapazität. L10-Kapazität: Ranger/Guardian/Templar Tower **2.000 TS**; **Ballista Tower 2.500**; **Lookout Tower 500 Scouts + 10 h Angriffswarnung**. Nur Stein-Kosten bis 58.000.
- **Fallen** (Außen-Mauerring, zählen nicht zum Limit) **neutralisieren** bis zu ihrer Kapazität eines passenden Angreifertyps (neutralisiert = richtet keinen Schaden an), max **50%** dieses Typs. L10-Kapazität **1.000 TS** (Camouflage vs Marine ≈ 2 War Galleons). Alle vier teilen Kosten (T/S bis 16.000/48.000): Pitfall→Infanterie, Barricade→Kavallerie, Arcane→Magie, Camouflage→Marine.

---

## 4. Einheiten `[A]` (Stats), `[V]` (Freischaltungen/Rollen)

Verteidigung ist **typ-spezifisch**, geordnet **vs Infanterie / Kavallerie / Magie / Artillerie**. Carry = Plünder-Kapazität. Unterhalt ist Getreide/Tag. Stats aus Ultima Codex `monster_data` (Community), daher `[A]`; gegengeprüft am Kampfbeispiel (nutzt Ranger Def-vs-Inf 40 / Def-vs-Kav 10 und Guardian Def-vs-Kav 50 — konsistent).

| Einheit | Rolle/Typ | Atk | Def I/K/M/A | Unterhalt | Carry | Trainer | Kosten (T/S/Fe/G) |
|---|---|--:|---|--:|--:|---|---|
| City Guard | defensiv spezial | 10 | 10/10/10/10 | 2 | – | Watch House | 100/–/–/– |
| Berserker | offensiv Infanterie | 50 | 15/12/10/15 | 6 | 10 | Training Yard | –/–/150/– |
| Ranger | defensiv Inf/Fernkampf | 30 | 40/10/25/15 | 3 | – | Training Yard | 160/–/–/– |
| Guardian | defensiv Inf (anti-Kav) | 10 | 30/50/20/15 | 3 | 20 | Training Yard | –/–/140/40 |
| Scout | Aufklärung Kav | 10 | 10/10/10/10 | 5 | – | Stable | –/–/40/120 |
| Crossbowman | defensiv (anti-Kav) | 40 | 40/90/30/40 | – | – | Stable | 150/–/–/200 |
| Knight | offensiv Kavallerie | 90 | 40/30/20/40 | 25 | 15–20 | Stable | –/–/250/100 |
| Mage | offensiv Magier | 70 | 15/10/30/15 | 5 | 5 | Mage Tower | –/–/50/150 |
| Warlock | offensiv Magier | 120 | 30/20/50/40 | 20 | 5 | Mage Tower | –/–/100/350 |
| Templar | defensiv gesegnet (anti-Magie) | 25 | 20/30/50/15 | – | – | Sanctuary | –/–/90/100 |
| Paladin | defensiv gesegnet Kav | 60 | 50/20/90/40 | – | – | Sanctuary | –/–/200/160 |
| Marshal (Baron) | Anführer (gründet/erobert Städte) | 10 | 100/50/20/10 | – | – | Sanctuary L10 | –/–/50k/100k |
| Ram | Belagerung | 50 (250 vs Bauwerke) | 20/20/20/50 | – | – | Siege Workshop | 500/–/300/– |
| Ballista | defensiv Belagerung (anti-Art) | 50 | 200/100/200/400 | – | – | Siege Workshop | 400/–/600/– |
| Catapult | Belagerung (anti-Gebäude) | 150 (250 vs Gebäude) | 100/100/200/50 | – | – | Siege Workshop | 300/600/200/– |
| Sloop | defensiv Marine | 1.200 | 4500/4500/2000/6000 | – | – | Shipyard | 6000/–/4000/2000 |
| Frigate | Marine-Transport (≤500 TS) | 3.000 | 4000/4000/2000/2000 | – | Truppen | Shipyard L6 | 15000/–/5000/5000 |
| War Galleon | offensiv Marine (=400 TS) | 12.000 (4.000 vs Bauwerke) | 5000/5000/2500/6000 | 2.500 | 3.000 | Shipyard L10 | 30000/–/10000/20000 |
| Dragon | episch (20 TS) | 700.000 | riesig | 75.000 | – | Dragon's Lair (Ei) | selten |

**Konter** (aus den Verteidigungsspalten): Rangers/Ballistae vs Infanterie; Guardians/Crossbowmen vs Kavallerie; Templars/Paladins/Ballistae vs Magie; Ballistae vs Artillerie. `[A]`

---

## 5. Kampfauflösung `[V]`

Aus Fandom `Combat_Mechanics` (Snapshot). Deterministisch; lebt in `shared/formulas/combat.ts`.

1. **Angriffskraft** `a_tot = Σ(atk_i × qty_i)`.
2. **Aufmerksamkeits-Aufteilung**: Verteidiger verteilen sich auf die Angreifertypen **proportional zum Angriffsanteil** `a_i / a_tot`.
3. **Verteidigungskraft** pro Angreifertyp `d_i = Σ(Def_des_Verteidigers_vs_diesen_Typ × zugewiesene_Verteidiger)`; `d_tot = Σ d_i`. (Die Verteidigungsspalte richtet sich nach dem *Angreifer*-Typ.)
4. **Sieger**: Angreifer gewinnt, wenn `a_tot > d_tot`.
5. **Verluste** (× Kampfintensität `I`):
   - **Verlierer**-Seite verliert `√(ratio) × I`; **Sieger**-Seite verliert `ratio × I`.
   - Verteidiger (einheitliches %): Sieg→`(a_tot/d_tot)·I`, Niederlage→`√(a_tot/d_tot)·I`.
   - Angreifer (pro Typ): Sieg→`(d_i/a_i)·I`, Niederlage→`√(d_i/a_i)·I`.
6. **Kampfintensität `I`**: Assault/Scout/Boss = **0,50**; Angreifer wenn Boss stirbt = 0,10; **Verteidiger einer Plünderung = 0,01**; Belagerungswelle / sonstiges ≈ **0,10**. `[V]` (die Formulierung „10% für den Rest" ist `[A]`).

**Verifiziertes Beispiel** — 1.000 Berserker (Atk 50) + 1.000 Knights (Atk 90) vs 1.400 Rangers + 1.400 Guardians, Assault:
`a_tot=140.000`; `d_tot=89.000` → Angreifer gewinnt. Verteidiger verlieren `0,5·√(140/89)=62,7%`. Berserker verlieren `0,5·(35.000/50.000)=35%`; Knights `0,5·(54.000/90.000)=30%`.

**Modifikatoren:**
- **City Wall** +1…**+50%** Verteidigung für Bodeneinheiten (nicht Marine). `[V]`
- **Türme** verdoppeln Verteidigung passender Einheiten (kapazitätsbegrenzt). **Fallen** neutralisieren ≤50% eines passenden Angreifertyps. `[V]`
- **Nachtschutz** (22–10 Uhr Serverzeit): Angreifer-Offensive **−40%**; Belagerungsanspruch gedeckelt auf 6%/Welle (statt 10% tags); PvE ausgenommen. `[A]`

**Angriffstypen** (brauchen eine Citadel): Scout, Plünderung (Loot = min(verfügbar, überlebende Carry-Kapazität); Gebäude unversehrt), Assault (1 Welle, 5× Schaden einer Belagerungswelle), Belagerung (stündliche Wellen; ein **Marshal/Baron** beansprucht **10%/Welle tags, 6%/nachts**; 100% = Eroberung; Marshal-Tod setzt auf 0 zurück), Support. Rams brechen Mauern; Catapults & War Galleons senken Gebäudestufen. `[V]/[A]`

---

## 6. Weltkarte & Städte

- **Welt** `[V]`: 6×6 = **36 Kontinente**, je **100×100** Felder (inkl. Ozean) → ~600×600 global; Koordinaten `x:y` (000:000–599:599). Kontinente öffnen mit wachsender Bevölkerung. *(Adelia nutzt eine gemeinsame Welt; wir behalten das Kontinent-/Koordinatenmodell, aber nur eine Welt.)*
- **Stadtraster** `[V]`: 9×9 mit der Hall im Zentrum; **10 Slots/Hall-Stufe, max 100 Gebäude**; Palace braucht freien **3×3**-Block; je 1 Hall/Citadel/City Wall pro Stadt. Internes Knoten-Terrain bei Gründung fixiert.
- **Stadt gründen** `[A]`: einen **Marshal (Baron)** auf einen leeren/herrenlosen Slot senden; Kosten ≈ **100k Timber + 100k Stone + 25k Iron + 25k Grain + 250 Karren (oder 25 Schiffe)**; neue Städte erhalten **7 Tage Schutz**.
- **Titel → max Städte** `[V]`: Sir/Knight/Baron = 1 · Earl = 2 · Marquess = 4 · Prince = 8 · Duke = 16 · King = 40 · Emperor = 80 (skaliert via Forschung). Jede Citadel ≈ 4 Titel-Stufen; Titel setzen auch einen **Mana**-Pool/-Regen (Spezialaktionen).
- **Reise** `[V]`: Karren 10 min/Tile (Cap 1.000); Schiffe 5 min/Tile + 1 h Laden je Richtung (Cap 10.000). Truppenreise ≈ 10–20 min/Tile je Typ `[A]`. Interkontinental via **Moongates/Portale** (eines aktiviert ~wöchentlich für 24 h) `[V]`.

---

## 7. PvE — Dungeons & Bosse `[V]`

- **Dungeons** nach Terrain: Forest (Spinnen→Diebe→Zentauren→Trolle), Hill (Skelette→Ghule→Gargoyles→Dämonen), Mountain (Orks→Troglodyten→Ettins→Minotauren), Sea (Piratenschiffe). Füllen sich über ~2 Wochen von 0→100%; höhere Fertigstellung = mehr Stufen + mehr Loot.
- **Loot-Cap pro Stufe (L1→L10)**: 320, 977, 2.000, 15.488, 30.000, 56.850, 117.175, 198.205, 356.970, **441.375**. Fertigstellungs-Multiplikator 50%→×1,5, 75%→×2, 100%→×3. Gold = % des Loots, 200% (L1) → 25% (L10).
- **Bosse** (Dragon/Hydra/Moloch/Kraken, 10 Stufen): Loot 500→**600.000**; Artefakte nur bei Tötung; **Boss nicht töten = 5× Verluste**. ~1 h Vorbereitung + Reise + 1 h Entladen.

*(Adelia benennt Kreaturen in eigene Mythologie um; Mechanik identisch.)*

---

## 8. Handel & Allianzen

- **Handel** `[V]`: siehe §6 Reise. Market ermöglicht Landhandel + erhöht angrenzende Townhouse-Steuer; Harbor ermöglicht Seehandel + Steuer. Spieler-Marktplatz für Ressource↔Gold-Tausch.
- **Allianzen** `[V]`: max **100** Mitglieder; Ränge (Leader/Officer/.../Novice) mit gestaffelten Rechten; Diplomatie = Allied / NAP / Enemy; privates Forum + Ankündigungen + Event-Log. Allianzweite **Faith**-Boni (§9).

---

## 9. Endgame & Sieg `[V]`

- **Acht Tugenden** (LoU): Compassion, Honesty, Honor, Humility, Justice, Sacrifice, Spirituality, Valor — jede gibt einen allianzweiten Kampf-/Tempo-/Wirtschaftsbonus. *(Adelia benennt in eigene Mythologie um; behält 8.)*
- **Schreine** (8/Kontinent) aktivieren mit der Zeit; ein aktiver Schrein **erleuchtet** nahe **castled Städte eines Allianzmitglieds** und lässt sie **pro Erleuchtung einen Palace bauen/ausbauen**.
- **Palace**: 3×3-Fläche, 1/Stadt, max L10, der Tugend des erleuchtenden Schreins. Paläste speisen die allianzweite **Faith** pro Tugend; **Bonus = Faith ÷ 2, gedeckelt 100% (bei 200 Faith)** `[A]`. Ein aktiver Schrein gibt zudem +10% Armee-Schaden für die kontrollierende Allianz.
- **Sieg (LoU, unser Modell)**: **eine Allianz gewinnt, wenn sie gemeinsam einen Stufe-10-Palace aller acht Tugenden besitzt** → die Welt endet; binäres First-to-complete. `[V]`
- **CotG-Variante** (Referenz): Tempel-der-8-Götter statt Paläste; Gold/Silber/Bronze-**Crowns** für 1./2./3.; Welt bleibt 30 Tage nach der 3. offen. Wir übernehmen für Phase 5 das einfachere **LoU-Einzelsieger**-Modell, notieren die Crown-Variante als mögliche Anpassung.

---

## 10. Quellen- & Confidence-Zusammenfassung

| Bereich | Confidence | Quelle |
|---|---|---|
| Gebäude-Kosten/-Output/-Bauzeit pro Stufe | **[V]** | Fandom-Gebäude-Wikitext-Snapshots |
| Adjazenzformel & Knoten/Cottage/Verstärker-% | **[V]** | Fandom `Resources` |
| Kampfformel + Intensität + Beispiel | **[V]** | Fandom `Combat_Mechanics` |
| Kartengröße, Stadtraster, Titel, Sieg, Handel, Dungeons | **[V]** | Fandom `World_Setup`/`Cities`/`Palaces`/`Shrine`/`Dungeons` + Ultima Codex |
| Numerische Einheiten-Stats (Atk/Def/Unterhalt/Carry) | **[A]** | Ultima Codex `monster_data` + Strategie-Blogs |
| Exakte Einheiten-Trainingszeiten; einige Carry-Kapazitäten | **[U]** | nicht gefunden — im Playtest kalibrieren |
| Adjazenz-Cottage-Gruppierung (additiv vs multiplikativ) | **[A]** | Fandom-vs-daydull-Konflikt — Modell hinter Tests |

Neu verifizierte/widerlegte Werte mit Datum + Quelle in `RESEARCH-LOG.md` ergänzen.
