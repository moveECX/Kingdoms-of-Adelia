# Referenz-Analyse — LordOfUltima (`FelixLeChat/LordOfUltima`)

> Analysiert 2026-05-24. Lokaler Clone: `research/reference-repos/LordOfUltima-master/` (gitignored).
> Upstream: https://github.com/FelixLeChat/LordOfUltima — Branch `master`.

## Kurz-Urteil

Eine **C#/.NET-WPF-Windows-Desktop**-Nachbildung von „LOU 2.0", **ohne Lizenz** und mit **30 MB EA-urheberrechtlich geschützter Grafik und Audio**, die der Autor offen als nicht ihm gehörend einräumt. Es ist die **falsche Plattform** (Desktop, kein Browser), die **falsche Sprache** (C#, kein TS), **als Code rechtlich unbrauchbar** (standardmäßig alle Rechte vorbehalten) und eine **IP-Gefahr** (gerippte Assets). Der Wert für uns beschränkt sich auf **High-Level-Mechanik-Abgleich**. Siehe `REPO-DECISION.md`.

## Lizenz

- **Keine `LICENSE`/`COPYING`-Datei** im Repo. Nur `README.md` und eine 12-Byte-`contributors.txt`.
- Bei fehlender Lizenz = **alle Rechte vorbehalten** nach Standard-Urheberrecht. Wir dürfen den Code **nicht** legal kopieren, anpassen oder weiterverbreiten.
- README sagt wörtlich: **„I DO NOT OWN ANY OF THE ARTS — They are all property of EA."** Ein ausdrückliches Eingeständnis, dass die gebündelten Assets EA/Phenomic-Eigentum sind.

## Vollständigkeit

Laut README kann die Desktop-App:
- Ein Spiel erstellen (online oder offline), eine erste Stadt bauen (Holz/Stein/Eisen/Nahrung-Gebäude) und Militärgebäude.
- Musik abspielen; Fenster-Skin wechseln (hell/dunkel).
- **Forschung** über ein Forschungsgebäude betreiben (bestätigt, dass LoU eine Forschungs-/Tech-Mechanik hatte, die später modellierenswert ist).
- Truppen rekrutieren und gegen **Dungeons und einen Boss** kämpfen.
- Lokal speichern; zwischen App-Instanzen chatten.

Ausdrücklich **fehlend**: echter Kampf vs Dungeons, Multiplayer, server-seitiges/offline Ressourcen-Ticking, server-seitiges Speichern. Es ist also ein **Client-seitiger Prototyp**, kein server-autoritatives MMO — das Gegenteil dessen, was wir brauchen.

## Tech-Stack

| Aspekt | Detail |
|---|---|
| Sprache | C# (112 `.cs`-Dateien) |
| UI | WPF / XAML (6 `.xaml`), Windows-only Desktop |
| Build | Visual-Studio-Solution (`.sln`, `.csproj`), gebündelte NuGet-`.nupkg`, PowerShell-Skripte (`.ps1`, `.psm1`) |
| Assets | `Images/` u. a.: **166 `.PNG`, 2 `.jpg`, 1 `.bmp`, 4 `.mp3`** ≈ **30,3 MB gesamt** |
| Config | `App.config`, `.settings`, `.resx` |

## Datenmodell

- Keine Datenbank. Zustand ist **in-memory + lokale Speicherdatei**; Gebäude-/Forschungs-/Truppen-Definitionen sind im C#-Code eingebettet statt in externen Datendateien.
- Weniger nützlich als OpenLoUs externalisiertes JSON zur Extraktion eines Datenmodells. Wir **verlassen** uns nicht darauf fürs Schema.

## IP-Gefahr — Assets strikt tabu 🚫

- Der `Images/`-Baum und die `.mp3`-Dateien sind **gerippte Lord-of-Ultima-Assets im EA-Eigentum**, laut Aussage des Autors.
- **Wir verwenden, kopieren, pausen, umfärben oder leiten kein Asset aus diesem Repo ab.** Weder für Platzhalter noch für „temporäre" Grafik noch als Referenz beim Zeichnen.
- Das Repo bleibt unter `research/reference-repos/`, das **gitignored** ist — diese Dateien dürfen nie in unsere Git-Historie gelangen. Erzwungen in `.gitignore`, benannt in `IP-COMPLIANCE.md`.

## Was wir wiederverwenden

- **Nur High-Level-Mechanik-Abgleich**: Bestätigung des Gebäude-Sets, Vorhandensein eines Forschungs-/Tech-Systems und einer Dungeon+Boss-PvE-Schleife. Das sind *Ideen/Mechaniken* (nicht schützbar), gegen die Wikis abgeglichen — nie Code oder Assets.

## Was wir NICHT übernehmen

- **Keinen Code** (keine Lizenz → alle Rechte vorbehalten).
- **Keinerlei Assets** (EA-Eigentum).
- **Keine UI-Layout-Pixel** — unsere UI ist eine eigene, dunkle, datendichte Admin-Ästhetik (`DESIGN-SYSTEM.md`), keine Nachbildung des LoU-Skins.
