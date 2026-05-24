# Design System — Aldermark

> **Aesthetic:** data-dense, professional **admin-tool** UI. Reference points: Bloomberg Terminal, Datadog, Grafana, a Linux system monitor. **Not** Notion/Stripe/Linear.
> **Dark-first** (authored dark; light mode is a future port, not a toggle bolted on).
> Live demo of every component: **`client/design-system.html`** (open in a browser).

## 0. Principles (non-negotiable)

- **Density is a feature.** 12–14px text, 4–8px padding, information-rich screens. Whitespace is earned.
- **Tables are first-class:** sortable columns, sticky header, sticky first column, **monospace right-aligned numbers**, subtle zebra striping.
- **Keyboard-driven:** Esc closes top modal; `1`–`9` switch tabs/views; `/` focuses search; arrow keys move table/grid selection; Enter activates.
- **Banned (AI-era clichés):** ❌ gradient buttons ❌ glassmorphism/blur ❌ floating cards with big drop-shadows ❌ purple→pink gradients ❌ "sparkle" decoration ❌ oversized rounded corners (max radius **4px**). Shadows appear **only** on overlays (modals/popovers), never on inline cards.
- **One restrained accent** (amber), used sparingly for primary action + focus + active state. Color carries meaning, not decoration.

## 1. Color tokens

All tokens are CSS custom properties on `:root` (see the demo). Semantic names — never reference raw hex in components.

### Surfaces
| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0d0f12` | App background (near-black, slightly cool) |
| `--bg-elevated` | `#15181d` | Panels, sidebars, HUD bar |
| `--bg-raised` | `#1c2027` | Inputs, raised rows, buttons |
| `--bg-row-alt` | `#121519` | Table zebra stripe |
| `--bg-hover` | `#1f242b` | Row/button hover |
| `--bg-selected` | `rgba(217,164,65,.14)` | Selected row/cell |
| `--backdrop` | `rgba(6,8,10,.66)` | Modal backdrop |

### Borders
| Token | Hex | Use |
|---|---|---|
| `--border-subtle` | `#262b33` | Default 1px dividers, panel edges |
| `--border-strong` | `#353c46` | Input borders, emphasized dividers |
| `--border-focus` | `#d9a441` | Focus ring (accent) |

### Text
| Token | Hex | Use |
|---|---|---|
| `--text-primary` | `#e6e9ee` | Primary text |
| `--text-secondary` | `#aab2bd` | Labels, secondary |
| `--text-muted` | `#6b7480` | Hints, captions, disabled-ish |
| `--text-disabled` | `#4a515b` | Disabled |
| `--text-inverse` | `#0d0f12` | Text on accent fills |

### Accent
| Token | Hex | Use |
|---|---|---|
| `--accent-primary` | `#d9a441` | Primary button, active tab, focus, key values |
| `--accent-hover` | `#e8b65a` | Hover |
| `--accent-active` | `#c08f30` | Pressed |
| `--accent-soft` | `rgba(217,164,65,.12)` | Accent-tinted backgrounds/badges |

### Status
| Token | Hex | Soft bg |
|---|---|---|
| `--status-success` | `#4a9e5c` | `rgba(74,158,92,.14)` |
| `--status-warn` | `#d0982f` | `rgba(208,152,47,.14)` |
| `--status-error` | `#cf5b43` | `rgba(207,91,67,.14)` |
| `--status-info` | `#4f86a8` | `rgba(79,134,168,.14)` |

### Resources (theme palette — distinct, legible on dark)
| Token | Hex | Resource |
|---|---|---|
| `--res-timber` | `#6f9d57` | Timber |
| `--res-stone` | `#9aa0a8` | Stone |
| `--res-iron` | `#6f8fa8` | Iron |
| `--res-grain` | `#c8923a` | Grain |
| `--res-gold` | `#e6c84f` | Gold |

## 2. Typography

```
--font-ui:   "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
```
- **All numeric/tabular values use `--font-mono`** with `font-variant-numeric: tabular-nums` for column alignment.

| Token | Size | Typical use |
|---|---|---|
| `--fs-xs` | 11px | Dense table captions, badges, axis labels |
| `--fs-sm` | 12px | Table body, secondary UI |
| `--fs-base` | 13px | Default body / controls |
| `--fs-md` | 14px | Panel section headers |
| `--fs-lg` | 16px | Panel titles |
| `--fs-xl` | 20px | Page title (rare) |

Weights: `--fw-regular:400`, `--fw-medium:500` (labels/headers), `--fw-semibold:600` (titles, key values). Line-height: `--lh-tight:1.25` (controls/tables), `--lh-normal:1.45` (prose).

## 3. Spacing & radius (4px base)

`--sp-1:4` · `--sp-2:8` · `--sp-3:12` · `--sp-4:16` · `--sp-5:24` · `--sp-6:32` · `--sp-8:48` (px).
Common control padding: `4px 8px` (sm), `6px 10px` (md). Radius: `--radius-sm:2px`, `--radius-md:4px` (**hard cap 4px**).

## 4. Elevation, motion, z-index

- Shadows (overlays only): `--shadow-popover: 0 4px 14px rgba(0,0,0,.45)`; `--shadow-modal: 0 8px 28px rgba(0,0,0,.55)`.
- Motion: `--dur-fast:90ms`, `--dur-base:140ms`, ease-out. No bouncy/spring; respect `prefers-reduced-motion`.
- Z-index: content `0`, sticky table header `10`, dropdown/popover `100`, tooltip `200`, modal `1000`.

## 5. Component inventory

Each component is specced in the demo with live markup.

- **Buttons** — variants: `primary` (accent fill, inverse text), `default` (raised bg, subtle border), `ghost` (transparent, border on hover), `danger` (error border/text, soft-error hover). Sizes `sm` (24px h) / `md` (28px h). Disabled = muted, no pointer. Icon-only square variant for toolbars.
- **Inputs** — text, number (mono, right-aligned), select, search (with `/` hint), checkbox, radio, toggle. Borders `--border-strong`; focus = 1px accent border + `--accent-soft` glow ring (no heavy outline). Invalid = error border + helper text.
- **Tables** — sticky header (`--bg-elevated`, bottom border `--border-strong`), optional sticky first column, zebra (`--bg-row-alt`), hover (`--bg-hover`), selected (`--bg-selected`, left accent bar). Sort indicator ▲/▼ in header. Numbers mono + right-aligned. Compact row height ~26px.
- **Panels** — `--bg-elevated`, `1px --border-subtle`, header row (title `--fs-md`/semibold + actions), body padding `--sp-3`. No shadow.
- **Modals** — centered, `--bg-elevated`, `--shadow-modal`, `--backdrop`. Header + body + footer (right-aligned actions). Esc closes; focus trap; stack rule in §6.
- **Tooltips** — dark `--bg-raised`, `1px --border-strong`, `--fs-xs`, `--shadow-popover`, 90ms delay. Keyboard-focusable triggers show on focus.
- **Tabs** — underline style: active tab = `--text-primary` + 2px `--accent-primary` bottom border; inactive = `--text-muted`. Number-key hotkeys.
- **Badges** — status (soft bg + status text color) and resource (resource color dot + mono value). Pill radius `--radius-sm`, `--fs-xs`, uppercase optional.
- **Progress / queue bars** — thin (6px) track `--bg-raised`, fill `--accent-primary` (or status color). Build-queue rows show label + ETA (mono) + bar.
- **Resource HUD bar** — top strip: per-resource icon/dot, current amount (mono), `/h` rate (muted), cap warning turns `--status-warn` when ≥90% full.
- **City grid cell** — square slot; empty = dashed `--border-subtle`; built = `--bg-raised` + building glyph + level badge; adjacency highlight = `--accent-soft` ring on contributing neighbors.

## 6. Layout patterns

- **App shell:** fixed top **Resource HUD** (32px) → below it a 3-region body: **left Sidebar nav** (collapsible, icon+label, 200px / 48px collapsed) · **center Main view** (city grid or world map or a data view) · **right Context panel** (selected building/city/unit details, 300px, collapsible).
- **3-column dashboard:** within Main, panels arranged in a CSS grid; each panel scrolls independently; sticky panel headers.
- **Modal stack:** at most 2 stacked; backdrop darkens per layer; Esc closes only the top; background scroll locked.
- **Empty/loading states:** muted text + a single primary action; skeleton rows for tables (no spinners-as-decoration).

## 7. Accessibility & quality bar

- Contrast: body text ≥ 4.5:1 on its surface; large/secondary ≥ 3:1. (Tokens above are tuned for this on `--bg-base`/`--bg-elevated`.)
- Every interactive element is focusable with a visible accent focus ring; no focus removal without replacement.
- Color is never the only signal — pair status color with text/icon (e.g., "▲ +120/h", "Under attack").
- Respect `prefers-reduced-motion`; never block input on animation.

## 8. Implementation notes

- Tokens live once in a global `tokens.css` imported by the Svelte app root; components reference only `var(--token)`.
- Svelte components use scoped `<style>`; shared primitives (Button, Table, Modal, Badge, Panel, Tabs, Tooltip, ProgressBar) live in `client/src/lib/ui/`.
- The demo (`client/design-system.html`) is **token-synced** with `tokens.css` — update both together; it's the visual contract reviewers check against.
