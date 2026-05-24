# IP-Compliance

> **Projektname:** *Kingdoms of Adelia*. Reichs-/Weltname: **Adelia**. Zentral in einer Konstante (`shared/constants/`).
> **Thematik:** eigene mittelalterliche Mythologie — ein erfundenes Grenzland-Reich aus rivalisierenden Stadtstaaten. Keine reale Geschichte, kein Ultima-Setting, **kein Tolkien-Setting**.

Dieses Projekt ist eine **Clean-Room-Reimplementierung** des *Gameplays* von Lord of Ultima (EA Phenomic) und Crown of the Gods (Gaming Addict Studios). Beide werden nicht mehr aktiv betrieben. Wir replizieren **Mechaniken**; wir erfinden **alles Ausdruckshafte**.

## 1. Der Leitsatz

- ✅ **Spielmechaniken, Regeln, Systeme, Formeln und Balancing-Zahlen sind NICHT urheberrechtlich schützbar.** Wir dürfen Adjazenz-Mathematik, Kampfauflösung, Produktionskurven, Bauzeiten und das *Verhalten* des Spiels frei replizieren.
- ❌ **Ausdruck IST geschützt.** Namen, Grafik, Sprites, Tiles, Icons, Sounds, Musik, UI-Screenshots, Story-/Lore-Texte und konkrete Tooltip-Prosa sind tabu.
- ❌ **Marken** (Spieltitel, geschützte Eigennamen) dürfen nicht in Code, UI, Doku oder Marketing erscheinen.

Im Zweifel: **Regel neu implementieren, Wörter neu schreiben, Grafik neu zeichnen.**

## 2. Verbotene Eigennamen — tauchen nirgendwo auf

Nicht verwenden in Code-Bezeichnern, UI, Doku, Commit-Messages, Asset-Dateinamen oder Marketing:

- Spieltitel: **„Lord of Ultima"**, **„Crown of the Gods"**, „LoU", „CotG" (nur innerhalb von `research/` zulässig, wenn auf die *Quelle* verwiesen wird, nie im Produkt).
- Ultima-Eigennamen: **„Ultima"**, **„Sosaria"**, **„Britannia"**, **„Caledonia"**, **„Moonglow"**, **„Trinsic"**, **„Yew"**, **„Minoc"**, **„Skara Brae"**, **„Vesper"**, **„Magincia"**, **„Jhelom"**, **„Cove"** und jeder weitere Ultima-Orts-/Figurenname.
- **Tolkien-Eigennamen**: **„Arda"**, „Mittelerde"/„Middle-earth", „Valinor", „Gondor", „Shire" usw. (siehe Entscheidungs-Log).
- Firmen-/Markennamen im Produktkontext: „EA", „Electronic Arts", „Phenomic", „Gaming Addict Studios".

⚠️ **Zwei verbotene Namen tauchen in den OpenLoU-Referenzdaten auf** und sind unten gemappt: **„Moonglow Tower"** und **„Trinsic Temple"**. Sie müssen in all unseren Daten und Code umbenannt sein.

## 3. Assets — strikt eigen

- **Null Assets aus `FelixLeChat/LordOfUltima`.** Dessen README gibt zu, die Grafik sei *„Eigentum von EA"*. Die 30 MB `.PNG`/`.mp3` sind für jeden Zweck tabu — auch nicht als Platzhalter oder Zeichenvorlage. Das Repo bleibt gitignored unter `research/reference-repos/`.
- **Keine Screenshots** der Originalspiele als Textur, Pausvorlage oder „Referenz beim Zeichnen".
- Alle Grafik (auch Greybox/Platzhalter) wird **eigens erstellt**: SVG-UI-Icons, eigene PNG/WebP-Tiles. Platzhalter = einfache eigene farbige Formen, nie abgeleitet.
- Audio (falls vorhanden) ist eigen oder ordentlich lizenziert (CC0/CC-BY mit Attribution), nie gerippt.

## 4. Code-Lizenzgrenze

- **OpenLoU ist GPLv3 (Copyleft).** Wir kopieren/ableiten **nicht** aus seinem Go-Code oder seinen JSON-Dateien. Wir transkribieren nur **numerische Werte** (Fakten), nachdem wir sie gegen die Wikis verifiziert haben.
- **FelixLeChat hat keine Lizenz → alle Rechte vorbehalten.** Wir verwenden keinen seiner Code.
- **Unsere Projektlizenz: AGPL-3.0-or-later** (`LICENSE`, © 2026 moveECX). Hinweis: AGPL ist selbst Copyleft — passt zu einem offenen Selbsthosting-Projekt; eine etwaige öffentliche Bereitstellung müsste den Quellcode anbieten. (Mit GPLv3 ist AGPLv3 kompatibel, falls wir je verifizierte Mechanik-Konzepte gegenprüfen — wir kopieren aber ohnehin keinen Code.)

## 5. Umbenennungs-Map — LoU/OpenLoU → Adelia

Kanonische Namen in `shared/constants/`. `[ERFORDERLICH]` = Umbenennung eines verbotenen/IP-Namens; übrige sind thematische Politur. *(Anzeigenamen sind aktuell englisch; Eindeutschung ist spätere Inhalts-Arbeit.)*

### Ressourcen (1:1 zu LoU, generische mittelalterliche Begriffe — unbedenklich)
| LoU | Adelia |
|---|---|
| Wood | **Timber** (Holz) |
| Stone | **Stone** (Stein) |
| Iron / Ore | **Iron** (Eisen) |
| Food | **Grain** (Getreide) |
| Gold | **Gold** |
| (seltene Ressourcen) | **Heartwood**, **Wardstone**, **Starsteel**, **Truegrain** *(vorläufig)* |
| Premiumwährung (OpenLoU „diamonds") | **Crowns** *(optional/zurückgestellt für Selbsthosting)* |

### Gebäude
| LoU / OpenLoU | Adelia | Hinweis |
|---|---|---|
| Town Hall | **Hall** | Kerngebäude |
| Woodcutter's Hut | **Woodcutter's Lodge** | Holz-Produzent |
| Sawmill | **Sawmill** | Holz-Verstärker |
| Quarry | **Quarry** | Stein-Produzent |
| Stonemason | **Stonemason** | Stein-Verstärker |
| Iron / Ore Mine | **Iron Mine** | Eisen-Produzent |
| Foundry | **Foundry** | Eisen-Verstärker |
| Farm | **Farm** | Getreide-Produzent |
| Mill | **Mill** | Getreide-Verstärker |
| Cottage | **Cottage** | Bautempo + Produzenten-Adjazenz |
| Townhouse | **Townhouse** | Steuer/Gold |
| Warehouse | **Warehouse** | Ressourcenlager |
| Hideout | **Cellar** | verstecktes (unplünderbares) Lager |
| Marketplace | **Market** | Landhandel + Steuer |
| Harbor | **Harbor** | Seehandel + Steuer |
| City Guard House | **Watch House** | bildet Verteidigungs-Wachen aus |
| Barracks | **Barracks** | Armeegrößen-Cap + Rekrutier-Adjazenz |
| Training Ground | **Training Yard** | Infanterie |
| Stable | **Stable** | Kavallerie |
| Workshop | **Siege Workshop** | Belagerungsgerät |
| Shipyard | **Shipyard** | Marine |
| **Moonglow Tower** | **Mage Tower** | Magier — **[ERFORDERLICH]** (Moonglow = Ultima) |
| **Trinsic Temple** | **Sanctuary** | gesegnete Einheiten/Anführer — **[ERFORDERLICH]** (Trinsic = Ultima) |
| Castle | **Citadel** | Plündern/Belagern/Erobern + Befehls-Queue |
| City Wall | **City Wall** | Verteidigungsbonus |
| Palace (Endgame) | **Seat of Power** | *via Recherche bestätigen* |
| Temple (Endgame) | **Wardstone Shrine** | *via Recherche bestätigen* |

### Einheiten & Endgame
Einheiten- und Sieg-Bauwerksnamen werden in `GAME-MECHANICS.md` finalisiert. Vorgeschlagenes neutrales Schema (keine IP-Namen): Militia, Spearman, Swordsman, Archer, Crossbowman, Light/Heavy Cavalry, Battering Ram, Catapult, Ballista, Mage, Warlock, Templar (gesegnet), Marshal (Anführer), Scout, Cog/Galley/Warship (Marine). Keiner davon ist ein Ultima-Name; unbedenklich.

## 6. Thematik & Setting (eigen)

*Adelia* ist ein zerfallener Kontinent unabhängiger Herrschaften, der aus einem langen Kollaps erwacht. Spieler sind **Wächter (Wardens)**, die Stadtstaaten gründen und ausbauen, indem sie Gebäude zur Ausnutzung der **Adjazenz** anlegen, monsterbesetzte **Ruinen** nach seltenen Materialien plündern, über Land- und Seerouten handeln und mit ihrer Allianz um uralte **Wardstone-Schreine** ringen. Der Ton ist geerdete Low-Fantasy — eigene Mythologie, nicht Artus, nicht Ultima, nicht Tolkien. Alle Lore-Texte werden neu geschrieben; keine Quell-Prosa wird wiederverwendet.

## 7. Log der Grenzfall-Entscheidungen

| Entscheidung | Urteil | Begründung |
|---|---|---|
| Projektname „Kingdoms of Arda" | ❌ Abgelehnt → „Kingdoms of Adelia" | „Arda" ist Tolkiens Weltname (Mittelerde-Legendarium) und ein existierender Bannerlord-Mod-Titel — würde das Ultima-Problem gegen ein Tolkien-Problem tauschen. „Adelia" ist ein realer Vorname, IP-frei. |
| Generische Gebäudenamen behalten („Barracks", „Quarry", „Harbor") | ✅ Erlaubt | Allgemeine Begriffe / generische mittelalterliche Funktionen; nicht als Marke schützbar. |
| LoUs exakte Adjazenz-Prozente & Kostenkurven replizieren | ✅ Erlaubt | Zahlen/Mechaniken sind Fakten, kein Ausdruck. |
| OpenLoUs `db.sql`/JSON direkt verwenden | ❌ Vermieden | GPLv3-Ableitungsrisiko; wir leiten Schema/Daten selbst neu ab. |
| Ein FelixLeChat-Bild/-Sound wiederverwenden | ❌ Verboten | EA-Eigentum, vom Autor zugegeben. |
| LoU-Tooltip-Text wörtlich reproduzieren | ❌ Verboten | Schützbare Prosa; wir schreiben eigene Texte. |
| Das Wort „Ultima" im Produkt | ❌ Verboten | Geschützte Marke. Nur in `research/` zulässig, wenn die Quelle zitiert wird. |

Neue Grenzfälle hier ergänzen, sobald sie auftreten.
