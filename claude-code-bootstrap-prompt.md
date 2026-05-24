# Claude Code — Project Bootstrap Prompt
## Browser-Based MMO Strategy Game (Lord of Ultima / Crown of the Gods Lineage)

---

You are setting up a new project: a browser-based MMO strategy game in the gameplay lineage of **Lord of Ultima** (EA Phenomic, 2010–2014) and **Crown of the Gods** (Gaming Addict Studios, 2015–2021). Both games are out of active development. This project is a clean-room reimplementation that replicates the core gameplay mechanics with original branding, theme, and assets.

## Scope of This Session

**Do NOT start writing game code in this session.** This is a planning and research phase. Your goal is to produce a thoroughly documented, well-structured repository that all subsequent Claude Code sessions can build against without re-deriving context.

Treat thoroughness here as an investment: solid `CLAUDE.md` and architecture docs now save weeks of refactoring later.

By the end of this session the user should have: a populated repo with all documentation files written (not stubs), the two reference repos cloned and analyzed under `research/`, key wiki pages mirrored locally, a concrete Phase 1 ticket list, and an initial git commit. **No gameplay code yet.**

---

## 1. Reference Material to Investigate

### 1.1 Existing Open-Source Implementations
Clone these into `research/reference-repos/` (gitignored) and produce an analysis doc for each in `research/`. Check the license of each before deciding whether to fork or build fresh; document the license, completeness, tech stack, data model, and any reusable parts.

- https://github.com/joaopedrosgs/OpenLoU — "OpenLoU", open-source remake
- https://github.com/FelixLeChat/LordOfUltima — second Lord of Ultima recreation

If the licenses permit and the code quality is reasonable, building on top of one of these is acceptable. If not, treat them strictly as reference for mechanics and data schemas. Decide and justify this in `research/REPO-DECISION.md`.

### 1.2 Game Mechanics Documentation
Mirror the key pages of these wikis into `research/wiki-snapshots/` (e.g. with `wget --mirror --convert-links --adjust-extension --page-requisites --no-parent`) so the project does not depend on them staying online.

- LoU Fandom Wiki: https://lordofultima.fandom.com — extensive community docs on buildings, formulas, combat
- Ultima Codex Wiki: https://wiki.ultimacodex.com/wiki/Lord_of_Ultima — additional technical detail
- Crown of the Gods official wiki: https://www.cotgopt.rlmglobal.com/wiki/index.php — actively maintained, mirrors LoU mechanics with refinements
- German Wikipedia (LoU history & design): https://de.wikipedia.org/wiki/Lord_of_Ultima

Prioritize: Buildings, Resources, Combat, Units, Adjacency Bonuses, Castle/Palace/Temple mechanics, Alliance system, Map structure.

---

## 2. Tech Stack — Decisions to Make and Document

The user has confirmed: browser-based, HTML + JavaScript. The user is an experienced Node.js/Express engineer.

Decide and document each of the following in `ARCHITECTURE.md`. For each decision, briefly justify and list one realistic alternative considered.

- **Language**: TypeScript on both client and server. **Fixed decision** — `strict: true`, no `any`. Do not propose plain JS.
- **Frontend approach**: Choose between Vanilla TS + small state lib, or a lightweight reactive framework (Svelte / Lit / Alpine / SolidJS). **Fixed decision**: React / Next.js are excluded — overkill for a strategy-game UI and add unnecessary build complexity. Decide between the remaining options and justify in `ARCHITECTURE.md`.
- **Map/grid rendering**: Canvas, SVG, or DOM grid. LoU uses (a) a city grid view with adjacency, (b) a continental world map. These have different rendering needs and may use different technologies.
- **Backend**: Node.js + Express (or Fastify) + WebSockets (`ws` or `socket.io`). The game requires a server-side tick/scheduler for production, training, building completion, and combat resolution. Client must never compute live state authoritatively.
- **Database**: PostgreSQL throughout (dev and prod) — **fixed decision**. No SQLite. Document the local dev setup clearly: recommend Docker Compose with a `postgres:16-alpine` service so contributors can `docker compose up -d db` and have a clean local instance in seconds. Use a query builder (Kysely or Knex) rather than a heavy ORM like Prisma — closer to the metal, easier to optimize for the tick loop's query patterns.
- **Real-time updates**: WebSockets for live state changes (incoming attacks, finished constructions, chat). REST/HTTP for non-real-time CRUD operations (account, settings, marketplace listings).
- **Build tooling**: Vite for the client. tsx or tsc for the server. Keep the toolchain minimal.
- **Asset pipeline**: Decide how original art assets will be authored, stored, and loaded. SVG for UI icons, PNG/WebP for tiles. Even greybox/placeholder art must be original — see IP Compliance below.

---

## 3. Design Philosophy

The user has expressed strong, consistent preferences in prior projects. Apply them throughout:

- **Data-dense, professional admin-tool aesthetic.** Reference points: Bloomberg Terminal, Datadog, Grafana, a Linux system monitor. Not Notion, not Stripe, not Linear.
- **Dark mode is the primary theme**, not an afterthought. A light mode may come later, but the design must be authored dark-first.
- **No generic AI-era patterns:** no gradient buttons, no glassmorphism, no floating cards with heavy shadows, no purple-to-pink gradients, no "sparkle" decoration, no oversized rounded corners.
- **Compact density**: 12–14px primary font size, tight padding (4–8px common), information-rich layouts. Whitespace is earned, not default.
- **Tabular data is first-class**: sortable columns, fixed headers, sticky first column, monospace for numerical alignment, zebra striping subtle.
- **Keyboard-driven where possible**: hotkeys for tab switching, modal close on Esc, focus management.

Document the system fully in `DESIGN-SYSTEM.md` with explicit hex tokens, type scale, spacing scale, and a component inventory.

---

## 4. Documentation Files to Produce

All files are top-level unless noted. Every file must contain substantive content by end of session — no `TODO: fill in` placeholders.

### `CLAUDE.md` — Master Handoff File
Read first by every future Claude Code session. Contains:
- Project mission and scope (3–5 sentences)
- Tech stack summary with links to `ARCHITECTURE.md` for detail
- Repository layout map
- Build, run, test, lint commands
- Coding standards summary with link to full standards
- Map of which doc covers what
- Definition of Done for features
- **Active context section**: what was last worked on, what's next — updated at end of every session

### `ARCHITECTURE.md`
- Full tech stack with justification
- System diagram (Mermaid or ASCII)
- Module boundaries: `client/` / `server/` / `shared/`
- Tick loop design: tick rate, what each tick processes, how clients are notified
- Data flow walkthrough for: building construction, resource production, combat, marketplace, alliance actions
- Scalability notes: target concurrent players, sharding strategy if any, DB bottlenecks anticipated

### `GAME-MECHANICS.md`
Distilled from the wikis. For each topic, cite the source page. Mark every formula or value as `[verified]`, `[approximate]`, or `[unknown]`.
- Resources (wood, stone, iron, food, gold) — sources, production formulas, caps
- Building list — costs per level, build times, effects, prerequisites, demolish/downgrade rules
- **Adjacency bonus system** — LoU's signature mechanic. Document the full formula including processing buildings, resource nodes, cottages, grasslands. Worked examples.
- Unit list — stats (attack, defense, HP, speed, upkeep), costs, training times, type relationships (cavalry, infantry, missile, caster)
- Combat resolution — formula, phases, retreat conditions, casualties calculation
- Map structure — continents, sectors, city placement rules, dungeon spawning, resource nodes
- Alliance system and victory conditions (palaces, temples, virtues)

### `GAME-DATA-SCHEMA.md`
The canonical data model:
- Database schema: tables, columns, types, indexes, foreign keys, with rationale
- Game-data file format conventions (e.g. `data/buildings.yaml`) with schema
- API contract: REST endpoints (method, path, request/response shape) + WebSocket message types (event name, payload schema, direction)
- Versioning strategy for the data files

### `DESIGN-SYSTEM.md`
- Color palette with semantic names and specific hex values (background-base, background-elevated, border-subtle, text-primary, text-muted, accent-primary, status-success/warn/error, resource-wood/stone/iron/food/gold)
- Typography scale (3–4 sizes, weights)
- Spacing scale (4px-based recommended)
- Component inventory: buttons, inputs, tables, modals, panels, tooltips, tabs, badges
- Layout patterns: 3-column dashboard, sidebar nav, modal stack rules
- A rendered demo page (`design-system.html`) showing every component

### `ROADMAP.md`
Phased, milestone-based plan. Each phase has explicit acceptance criteria.
- **Phase 1 — Solo Prototype**: one city, build/produce/upgrade loop, adjacency bonuses working, no combat, no networking. Local dev only. SQLite. ~2–4 weeks.
- **Phase 2 — World Map & Monsters**: multi-city, world map view, basic PvE combat against dungeon/monster spawns, no other players. ~3–5 weeks.
- **Phase 3 — Multiplayer Foundations**: auth, sessions, persistent world, multiple accounts on same server, no PvP yet. ~3–4 weeks.
- **Phase 4 — PvP & Economy**: player-vs-player combat, marketplace, alliances. ~4–6 weeks.
- **Phase 5 — Endgame**: temples/palaces, victory conditions, leaderboards. ~3–4 weeks.

End Phase 1 with a Phase 1 ticket list ready to pick up: each ticket has a title, brief description, and acceptance criteria.

### `IP-COMPLIANCE.md`
Legal boundaries. The clone must not infringe EA/Ultima or Gaming Addict Studios IP.
- **Game mechanics are not copyrightable.** Free to replicate behavior, formulas, balance.
- **Do NOT use** these names anywhere in code, UI, docs, or marketing: "Lord of Ultima", "Crown of the Gods", "Caledonia", "Sosaria", "Britannia", "Moonglow Tower", "Trinsic Tower", "Yew", "Minoc", "Skara Brae", or any other Ultima-series proper noun. Maintain a renaming map: original LoU name → our name.
- **Do NOT copy** art, sprites, tiles, icons, sounds, music, UI screenshots, or storytext.
- **Theme & setting must be original.** Suggest 3–4 candidate themes to the user (e.g. post-apocalyptic city-states, ancient Mesopotamian, sci-fi colony world, original-mythology medieval) and let the user pick.
- Document every borderline naming/asset decision.

### `RESEARCH-LOG.md`
Date-stamped running log of what was learned from each source. Confirmed knowledge separated from educated guesses. Future sessions append to this file as new mechanics are uncovered or verified.

### `README.md`
Public-facing project intro. Brief. Setup commands. Link to `CLAUDE.md` for full context.

---

## 5. Project Structure to Bootstrap

```
/
├── CLAUDE.md
├── ARCHITECTURE.md
├── GAME-MECHANICS.md
├── GAME-DATA-SCHEMA.md
├── DESIGN-SYSTEM.md
├── ROADMAP.md
├── IP-COMPLIANCE.md
├── RESEARCH-LOG.md
├── README.md
├── .gitignore
├── .editorconfig
├── docker-compose.yml         (PostgreSQL service for local dev)
├── package.json (workspace root)
├── tsconfig.base.json
├── research/
│   ├── REPO-DECISION.md
│   ├── openlou-analysis.md
│   ├── lordofultima-felix-analysis.md
│   ├── wiki-snapshots/        (mirrored wiki HTML, kept in git)
│   └── reference-repos/       (cloned OSS repos, gitignored)
├── server/
│   ├── src/
│   ├── db/
│   │   ├── migrations/
│   │   └── schema.sql
│   ├── game/                  (tick loop, mechanics, formulas)
│   ├── routes/
│   ├── ws/
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   ├── public/
│   ├── assets/                (original assets only)
│   ├── design-system.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── shared/
│   ├── schemas/               (zod or similar — shared validation)
│   ├── constants/
│   └── types/
└── data/
    ├── buildings.yaml
    ├── units.yaml
    ├── resources.yaml
    └── README.md              (schema docs for the data files)
```

Adjust if architecture decisions justify it. Keep the principle: clean separation of client / server / shared, with research isolated.

---

## 6. Coding Standards

- **TypeScript everywhere.** `strict: true`. No `any`, no `// @ts-ignore` without an accompanying comment explaining why.
- **File length**: prefer under 300 lines. Hard cap 500. Split aggressively.
- **No barrel re-exports** (`index.ts` that just re-exports everything) that hide module structure.
- **No premature abstraction.** No `Manager` / `Helper` / `Service` / `Util` classes without concrete justification.
- **Test what's worth testing**: formulas, combat resolution, tick logic, schema validation. Skip UI minutiae.
- **Comments explain why, not what.** Self-documenting code first.
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- **Imports**: absolute paths from package root (`@/game/combat` not `../../../game/combat`). Configure tsconfig paths.
- **Formatting**: Prettier with default config. ESLint with `@typescript-eslint/strict`.

Document in `CLAUDE.md`.

---

## 7. Ask the User Before Producing Documents

Before writing the documents above, ask the user once (in a single batched message, not back-and-forth) for:

1. **Theme/setting** for the rebrand (medieval-renamed, sci-fi colony, post-apocalyptic, original mythology, other)?
2. **Project working title**?
3. **Deployment intent**: self-hosted only / private group / public-facing?
4. **Scope**: single shared world, or multiple parallel rounds/worlds from the start?
5. **Time budget per week** — affects realistic roadmap pacing?
6. **Preserve or change**: anything specific they liked or disliked in LoU/CotG?

The following decisions are already locked and require no confirmation: TypeScript (strict), no React/Next.js, PostgreSQL for both dev and prod.

Then proceed without further interactive questions — make sensible decisions and document them.

---

## 8. Definition of "Session Done"

By the end of this session:

- All ten markdown docs (CLAUDE, ARCHITECTURE, GAME-MECHANICS, GAME-DATA-SCHEMA, DESIGN-SYSTEM, ROADMAP, IP-COMPLIANCE, RESEARCH-LOG, README, plus `research/REPO-DECISION.md`) are filled with substantive content.
- The directory structure above exists with placeholder/skeleton package.json files configured.
- Both reference repos are cloned to `research/reference-repos/` (gitignored), with one analysis file each in `research/`.
- Key wiki pages are mirrored to `research/wiki-snapshots/` and committed.
- `GAME-MECHANICS.md` lists every building from LoU with cost-per-level and a `[verified]` / `[approximate]` / `[unknown]` status flag per row.
- `ROADMAP.md` has a concrete Phase 1 ticket list (10–20 tickets) ready to start.
- An initial git commit has been made with a clear message.
- The active-context section of `CLAUDE.md` points to "Phase 1 — Ticket #001" as next.

**No gameplay code is written in this session.** The next session begins Phase 1 implementation against the docs produced here.
