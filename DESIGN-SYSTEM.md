# Design-System — Kingdoms of Adelia

> **Ästhetik:** datendichte, professionelle **Admin-Tool**-UI. Referenzen: Bloomberg Terminal, Datadog, Grafana, ein Linux-System-Monitor. **Nicht** Notion/Stripe/Linear.
> **Dark-first** (dunkel entworfen; Light-Mode ist ein späterer Port, kein nachträglich aufgesetzter Schalter).
> Live-Demo aller Komponenten: **`client/design-system.html`** (im Browser öffnen).

## 0. Prinzipien (nicht verhandelbar)

- **Dichte ist ein Feature.** 12–14px Text, 4–8px Padding, informationsreiche Screens. Weißraum wird verdient.
- **Tabellen sind erstklassig:** sortierbare Spalten, fixierter Header, fixierte erste Spalte, **monospace, rechtsbündige Zahlen**, dezentes Zebra-Streifenmuster.
- **Tastatur-getrieben:** Esc schließt das oberste Modal; `1`–`9` wechseln Tabs/Views; `/` fokussiert die Suche; Pfeiltasten bewegen die Tabellen-/Raster-Auswahl; Enter aktiviert.
- **Verboten (KI-Ära-Klischees):** ❌ Verlaufs-Buttons ❌ Glassmorphism/Blur ❌ schwebende Karten mit großen Schlagschatten ❌ Lila→Pink-Verläufe ❌ „Sparkle"-Deko ❌ übergroße abgerundete Ecken (max Radius **4px**). Schatten erscheinen **nur** auf Overlays (Modals/Popovers), nie auf Inline-Karten.
- **Ein zurückhaltender Akzent** (Bernstein), sparsam für Primäraktion + Fokus + Aktiv-Zustand. Farbe trägt Bedeutung, keine Deko.

## 1. Farb-Tokens

Alle Tokens sind CSS Custom Properties auf `:root` (siehe Demo). Semantische Namen — nie rohe Hex in Komponenten.

### Flächen
| Token | Hex | Verwendung |
|---|---|---|
| `--bg-base` | `#0d0f12` | App-Hintergrund (fast schwarz, leicht kühl) |
| `--bg-elevated` | `#15181d` | Panels, Sidebars, HUD-Leiste |
| `--bg-raised` | `#1c2027` | Inputs, hervorgehobene Zeilen, Buttons |
| `--bg-row-alt` | `#121519` | Tabellen-Zebra |
| `--bg-hover` | `#1f242b` | Zeilen-/Button-Hover |
| `--bg-selected` | `rgba(217,164,65,.14)` | ausgewählte Zeile/Zelle |
| `--backdrop` | `rgba(6,8,10,.66)` | Modal-Backdrop |

### Rahmen
| Token | Hex | Verwendung |
|---|---|---|
| `--border-subtle` | `#262b33` | Standard-1px-Trenner, Panel-Kanten |
| `--border-strong` | `#353c46` | Input-Rahmen, betonte Trenner |
| `--border-focus` | `#d9a441` | Fokus-Ring (Akzent) |

### Text
| Token | Hex | Verwendung |
|---|---|---|
| `--text-primary` | `#e6e9ee` | Primärtext |
| `--text-secondary` | `#aab2bd` | Labels, Sekundär |
| `--text-muted` | `#6b7480` | Hinweise, Captions |
| `--text-disabled` | `#4a515b` | Deaktiviert |
| `--text-inverse` | `#0d0f12` | Text auf Akzentfüllung |

### Akzent
| Token | Hex | Verwendung |
|---|---|---|
| `--accent-primary` | `#d9a441` | Primär-Button, aktiver Tab, Fokus, Schlüsselwerte |
| `--accent-hover` | `#e8b65a` | Hover |
| `--accent-active` | `#c08f30` | Gedrückt |
| `--accent-soft` | `rgba(217,164,65,.12)` | akzent-getönte Hintergründe/Badges |

### Status
| Token | Hex | Soft-BG |
|---|---|---|
| `--status-success` | `#4a9e5c` | `rgba(74,158,92,.14)` |
| `--status-warn` | `#d0982f` | `rgba(208,152,47,.14)` |
| `--status-error` | `#cf5b43` | `rgba(207,91,67,.14)` |
| `--status-info` | `#4f86a8` | `rgba(79,134,168,.14)` |

### Ressourcen (Themen-Palette — unterscheidbar, lesbar auf Dunkel)
| Token | Hex | Ressource |
|---|---|---|
| `--res-timber` | `#6f9d57` | Timber |
| `--res-stone` | `#9aa0a8` | Stone |
| `--res-iron` | `#6f8fa8` | Iron |
| `--res-grain` | `#c8923a` | Grain |
| `--res-gold` | `#e6c84f` | Gold |

## 2. Typografie

```
--font-ui:   "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
```
- **Alle numerischen/tabellarischen Werte nutzen `--font-mono`** mit `font-variant-numeric: tabular-nums` für Spaltenausrichtung.

| Token | Größe | Typische Verwendung |
|---|---|---|
| `--fs-xs` | 11px | dichte Tabellen-Captions, Badges, Achsenbeschriftung |
| `--fs-sm` | 12px | Tabellen-Body, sekundäre UI |
| `--fs-base` | 13px | Standard-Body / Controls |
| `--fs-md` | 14px | Panel-Abschnitts-Header |
| `--fs-lg` | 16px | Panel-Titel |
| `--fs-xl` | 20px | Seitentitel (selten) |

Gewichte: `--fw-regular:400`, `--fw-medium:500` (Labels/Header), `--fw-semibold:600` (Titel, Schlüsselwerte). Zeilenhöhe: `--lh-tight:1.25` (Controls/Tabellen), `--lh-normal:1.45` (Fließtext).

## 3. Abstände & Radius (4px-Basis)

`--sp-1:4` · `--sp-2:8` · `--sp-3:12` · `--sp-4:16` · `--sp-5:24` · `--sp-6:32` · `--sp-8:48` (px).
Übliches Control-Padding: `4px 8px` (sm), `6px 10px` (md). Radius: `--radius-sm:2px`, `--radius-md:4px` (**harte Grenze 4px**).

## 4. Elevation, Motion, z-index

- Schatten (nur Overlays): `--shadow-popover: 0 4px 14px rgba(0,0,0,.45)`; `--shadow-modal: 0 8px 28px rgba(0,0,0,.55)`.
- Motion: `--dur-fast:90ms`, `--dur-base:140ms`, ease-out. Kein Federn/Springen; `prefers-reduced-motion` respektieren.
- z-index: Inhalt `0`, fixierter Tabellen-Header `10`, Dropdown/Popover `100`, Tooltip `200`, Modal `1000`.

## 5. Komponenten-Inventar

Jede Komponente ist in der Demo mit Live-Markup spezifiziert.

- **Buttons** — Varianten: `primary` (Akzentfüllung, inverser Text), `default` (raised BG, dezenter Rahmen), `ghost` (transparent, Rahmen bei Hover), `danger` (Error-Rahmen/-Text, Soft-Error-Hover). Größen `sm` (24px) / `md` (28px). Disabled = gedämpft, kein Pointer. Icon-only-Quadrat für Toolbars.
- **Inputs** — Text, Zahl (mono, rechtsbündig), Select, Suche (mit `/`-Hinweis), Checkbox, Radio, Toggle. Rahmen `--border-strong`; Fokus = 1px Akzentrahmen + `--accent-soft`-Ring (kein schwerer Outline). Invalid = Error-Rahmen + Hilfetext.
- **Tabellen** — fixierter Header (`--bg-elevated`, unterer Rahmen `--border-strong`), optional fixierte erste Spalte, Zebra (`--bg-row-alt`), Hover (`--bg-hover`), Auswahl (`--bg-selected`, linker Akzentbalken). Sortier-Indikator ▲/▼ im Header. Zahlen mono + rechtsbündig. Kompakte Zeilenhöhe ~26px.
- **Panels** — `--bg-elevated`, `1px --border-subtle`, Header-Zeile (Titel `--fs-md`/semibold + Aktionen), Body-Padding `--sp-3`. Kein Schatten.
- **Modals** — zentriert, `--bg-elevated`, `--shadow-modal`, `--backdrop`. Header + Body + Footer (rechtsbündige Aktionen). Esc schließt; Fokus-Trap; Stapel-Regel in §6.
- **Tooltips** — dunkel `--bg-raised`, `1px --border-strong`, `--fs-xs`, `--shadow-popover`, 90ms Verzögerung. Tastatur-fokussierbare Trigger zeigen bei Fokus.
- **Tabs** — Unterstrich-Stil: aktiver Tab = `--text-primary` + 2px `--accent-primary` unten; inaktiv = `--text-muted`. Zifferntasten-Hotkeys.
- **Badges** — Status (Soft-BG + Status-Textfarbe) und Ressource (Ressourcen-Farbpunkt + mono-Wert). Pill-Radius `--radius-sm`, `--fs-xs`.
- **Progress-/Queue-Balken** — dünn (6px), Track `--bg-raised`, Füllung `--accent-primary` (oder Statusfarbe). Bau-Queue-Zeilen zeigen Label + ETA (mono) + Balken.
- **Ressourcen-HUD-Leiste** — obere Leiste: pro Ressource Icon/Punkt, aktueller Betrag (mono), `/h`-Rate (gedämpft), Cap-Warnung wird `--status-warn` bei ≥90% Füllung.
- **Stadtraster-Zelle** — quadratischer Slot; leer = gestrichelt `--border-subtle`; bebaut = `--bg-raised` + Gebäude-Glyph + Stufen-Badge; Adjazenz-Highlight = `--accent-soft`-Ring an beitragenden Nachbarn.

## 6. Layout-Muster

- **App-Shell:** fixes oberes **Ressourcen-HUD** (32px) → darunter ein 3-Bereichs-Body: **linke Sidebar-Nav** (einklappbar, Icon+Label, 200px / 48px eingeklappt) · **zentrale Hauptansicht** (Stadtraster oder Weltkarte oder Datenansicht) · **rechtes Kontext-Panel** (Details des ausgewählten Gebäudes/Stadt/Einheit, 300px, einklappbar).
- **3-Spalten-Dashboard:** innerhalb der Hauptansicht in einem CSS-Grid angeordnete Panels; jedes scrollt unabhängig; fixierte Panel-Header.
- **Modal-Stapel:** höchstens 2 gestapelt; Backdrop verdunkelt je Ebene; Esc schließt nur das oberste; Hintergrund-Scroll gesperrt.
- **Empty-/Loading-States:** gedämpfter Text + eine Primäraktion; Skeleton-Zeilen für Tabellen (keine Spinner als Deko).

## 7. Barrierefreiheit & Qualitätslatte

- Kontrast: Body-Text ≥ 4,5:1 auf seiner Fläche; groß/sekundär ≥ 3:1. (Die Tokens sind dafür auf `--bg-base`/`--bg-elevated` abgestimmt.)
- Jedes interaktive Element ist mit sichtbarem Akzent-Fokus-Ring fokussierbar; kein Entfernen des Fokus ohne Ersatz.
- Farbe ist nie das einzige Signal — Statusfarbe immer mit Text/Icon paaren (z. B. „▲ +120/h", „Unter Angriff").
- `prefers-reduced-motion` respektieren; Eingaben nie durch Animation blockieren.

## 8. Implementierungs-Hinweise

- Tokens leben einmal in einem globalen `tokens.css`, importiert vom Svelte-App-Root; Komponenten referenzieren nur `var(--token)`.
- Svelte-Komponenten nutzen gescopetes `<style>`; geteilte Primitive (Button, Table, Modal, Badge, Panel, Tabs, Tooltip, ProgressBar) leben in `client/src/lib/ui/`.
- Die Demo (`client/design-system.html`) ist **token-synchron** mit `tokens.css` — beide zusammen aktualisieren; sie ist der visuelle Vertrag, gegen den Reviewer prüfen.
