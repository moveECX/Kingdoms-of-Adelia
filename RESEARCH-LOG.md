# Recherche-Log

> Laufende, datierte Aufzeichnung dessen, was wir gelernt haben und woher. **Gesichertes Wissen ist von Vermutungen getrennt.** Künftige Sessions hängen einen neuen datierten Abschnitt an, wenn Mechaniken aufgedeckt, verifiziert oder widerlegt werden. Confidence-Tags `[V]`/`[A]`/`[U]` wie in `GAME-MECHANICS.md`.

---

## 2026-05-24 — Bootstrap-Recherche-Session

### Genutzte Quellen
- **Referenz-Repos** (vorab in `re/` heruntergeladen, verschoben nach `research/reference-repos/`):
  - `joaopedrosgs/OpenLoU` — Go + PostgreSQL, **GPLv3**, „früher Zustand". Nützlich: `db.sql`-Schema + `modules/constructions/*.json`-Gebäudedaten. → `research/openlou-analysis.md`.
  - `FelixLeChat/LordOfUltima` — C#/.NET-WPF-Desktop, **keine Lizenz**, **EA-eigene Assets** (vom Autor zugegeben). Nur Mechanik-Referenz. → `research/lordofultima-felix-analysis.md`.
- **Wikis** (gespiegelt nach `research/wiki-snapshots/`): LoU-Fandom (Rohwikitext, mit Browser-UA geladen — direkter Bot-Fetch ist 403, aber UA-gespoofter `?action=raw` liefert 200), Ultima Codex, Crown-of-the-Gods-Website, en/de-Wikipedia.
- **3 parallele Recherche-Agenten** deckten Gebäude/Adjazenz, Einheiten/Kampf und Karte/Allianz/Endgame ab; ihre Sekundärquellen-Zahlen wurden dann auf `[V]` **hochgestuft**, wo der Fandom-Rohwikitext sie bestätigte.

### Gesichert `[V]` (Primärquelle: Fandom-Rohwikitext-Snapshots)
- **Alle Gebäude-Tabellen pro Stufe**: Kosten (Timber/Stone), Output/Effekt, Bauzeit, Rangpunkte, max Stufe 10. Produzenten-Trio (Woodcutter/Quarry/Iron Mine) teilt eine Kurve (Output `20…300/h`, Kosten `50…38.000` Timber); **Farm hat eine eigene, frühzeitig niedrigere Kurve** (`5,8,15,20,30,45,75,120,200,300`). Die vier Verstärker teilen eine Kurve (`+30%…+75%` Effizienz, `+20%…+200%` Lager). Die vier Fallen teilen eine Kurve.
- **Adjazenzformel**: `prod = base × (1 + Σnodes + Σcottages) × (1 + enhancer)`; Knoten = +50% erster / +40% je weiterer; Cottage = +3%…+30% (ihr „Manpower"-Stat); Verstärker = +30%…+75%, **max einer**, danach angewandt. (Fandom `Resources`.)
- **Kampfformel**: Aufmerksamkeit nach Angriffsanteil verteilt; typ-spezifische Verteidigungsspalten (Inf/Kav/Magie/Art); Angreifer gewinnt bei `a_tot>d_tot`; Verluste = `ratio×I` (Sieger) / `√ratio×I` (Verlierer); Intensität `I` = .5 Assault/Scout/Boss, .01 Plünder-Verteidiger, ≈.1 sonst. Beispiel reproduziert 62,7% Verteidiger-Verlust. (Fandom `Combat_Mechanics`.)
- **Stadt**: 9×9-Raster, Hall im Zentrum, **10 Slots/Hall-Stufe → max 100 Gebäude**; Palace braucht freies 3×3; je ein Hall/Citadel/City Wall pro Stadt.
- **Welt**: 6×6 = 36 Kontinente × 100×100 Felder; Koordinaten `x:y`. **LoUs Welt hieß „Caledonia"** → bestätigt, dass es auf unserer Verbotsliste steht.
- **Titel → max Städte**: Sir/Knight/Baron 1, Earl 2, Marquess 4, Prince 8, Duke 16, King 40, Emperor 80(+). Citadel ≈ 4 Titel-Stufen; Titel setzen Mana-Pool/-Regen.
- **Handel**: Karren 1.000 Cap @ 10 min/Tile (200 @ Market L10); Schiffe 10.000 Cap @ 5 min/Tile +1 h Laden (30 @ Harbor L10).
- **PvE-Loot-Caps** nach Dungeon-Stufe (320 → 441.375) und Boss-Stufe (500 → 600.000); Fertigstellung ×1,5/×2/×3 bei 50/75/100%; **Boss nicht getötet = 5× Verluste**.
- **Endgame/Sieg**: 8 Tugenden; Schreine erleuchten castled Allianzstädte zum Bau von Palästen (3×3, L10); **Allianz gewinnt mit einem L10-Palast aller 8 Tugenden** → Welt endet. Faith-Bonus = Faith/2 gedeckelt 100% (`[A]` auf das /2).
- **Einheiten-Freischaltstufen** nach Trainer-Gebäudestufe (z. B. Stable: Scout L1 / Crossbowman L5 / Knight L10).
- **Historie**: EA Phenomic (Volker Wertich), pures JS, Bigpoint; Open Beta **2010-04-20**, Abschaltung **2014-05-12**. CotG von Gaming Addict Studios (Gordon Tunstall), Kickstarter in 17 min finanziert, Open Beta **2016-01-23**.

### Vermutungen / approximativ `[A]`
- **Numerische Einheiten-Stats** (Angriff, die vier Verteidigungswerte, Unterhalt, Carry) — aus Ultima Codex `monster_data` + Strategie-Blogs; konsistent mit dem verifizierten Kampfbeispiel, aber nicht aus einer Fandom-Primärtabelle.
- Faith→Bonus-Divisor (/2 vs Cap-bei-100) — Quellen widersprechen sich.
- Exakte Truppen-Reisezeit-Formel pro Tile (≈10–20 min/Tile je Einheit).

### Offene Konflikte (im Playtest kalibrieren; hinter `shared/formulas` + Tests isolieren)
1. **Adjazenz-Cottage-Gruppierung**: Fandom = Cottages additiv mit Knoten, Verstärker danach multiplikativ (→1.522/h im Beispiel); daydull-Community-Guide = Cottages separate multiplikative Gruppe (→1.932/h, geprüft per Unit-Test). **Entscheidung: das Fandom-Modell kanonisch implementieren.**
2. **Produzenten-Basis-Output bei L10**: Fandom `300` `[V]` vs OpenLoU-JSON `300` vs ein Agenten-Sekundär-Snippet `250`. → `300` verwenden.
3. **Kampfintensität „10% für den Rest"**: wörtlich 0,10 vs 0,10×0,50. → 0,10 verwenden, geflaggt.

### Datenlücken `[U]`
- Exakte **Trainingszeiten** pro Einheit (nur Rekrutiertempo-% pro Gebäudestufe bekannt).
- **Carry-Kapazitäten** einiger Einheiten (Ranger/Crossbowman/Templar/Paladin/Sloop/Frigate).
- Palace-Kostentabelle pro Stufe; präziser Erleuchtungs-Radius/-Intervall für LoU (CotGs 20-Tile / 72→36 h ist `[V]`, aber eine CotG-Zahl).

### Notizen für die nächste Session
- Der Fandom-`?action=raw`-+-Browser-UA-Trick ist der zuverlässige Weg, exakte Tabellen zu ziehen; damit `[U]`-Lücken füllen (z. B. `Palace`/einzelne Einheiten-Seiten unter anderen Titeln laden).
- OpenLoU-Daten haben Fehler (doppelte IDs, fehlbeschriftete Felder) — nie über den Fandom-Wikitext stellen.
