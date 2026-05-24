# Reference Analysis — LordOfUltima (`FelixLeChat/LordOfUltima`)

> Analyzed 2026-05-24. Local clone: `research/reference-repos/LordOfUltima-master/` (gitignored).
> Upstream: https://github.com/FelixLeChat/LordOfUltima — branch `master`.

## Summary verdict

A **C#/.NET WPF Windows desktop** single-player recreation of "LOU 2.0", **with no license** and **30 MB of EA-copyrighted art and audio** that the author openly admits he does not own. It is the **wrong platform** (desktop, not browser), the **wrong language** (C#, not TS), **legally unusable as code** (all-rights-reserved by default), and an **IP hazard** (ripped assets). Value to us is limited to **high-level mechanics cross-reference**. See `REPO-DECISION.md`.

## License

- **No `LICENSE` / `COPYING` file anywhere in the repo.** Only `README.md` and a 12-byte `contributors.txt`.
- Under default copyright, "no license" = **all rights reserved**. We may **not** legally copy, adapt, or redistribute its code.
- README states verbatim: **"I DO NOT OWN ANY OF THE ARTS — They are all property of EA."** This is an explicit admission that bundled assets are EA/Phenomic property.

## Completeness

Per its README, the desktop app can:
- Create a game (online or offline), build a first city (wood/stone/iron/food buildings) and military buildings.
- Play music; switch window skin (light/dark).
- Do **research** via a research building (confirms LoU had a research/tech mechanic worth modelling later).
- Recruit troops and fight **dungeons and a boss**.
- Save locally; chat between app instances.

Explicitly **missing**: real combat vs dungeons, multiplayer, server-side/offline resource ticking, server-side save. So it is a **client-side prototype**, not a server-authoritative MMO — the opposite of what we need.

## Tech stack

| Aspect | Detail |
|---|---|
| Language | C# (112 `.cs` files) |
| UI | WPF / XAML (6 `.xaml`), Windows-only desktop |
| Build | Visual Studio solution (`.sln`, `.csproj`), bundled NuGet `.nupkg`, PowerShell scripts (`.ps1`, `.psm1`) |
| Assets | `Images/` + others: **166 `.PNG`, 2 `.jpg`, 1 `.bmp`, 4 `.mp3`** ≈ **30.3 MB total** |
| Config | `App.config`, `.settings`, `.resx` |

## Data model

- No database. State is **in-memory + local save file**; building/research/troop definitions are embedded in C# code rather than external data files.
- Less useful than OpenLoU's externalized JSON for extracting a data model. We do **not** rely on it for schema.

## IP hazard — assets are strictly off-limits 🚫

- The `Images/` tree and `.mp3` files are **ripped Lord of Ultima assets owned by EA**, per the author's own statement.
- **We will not use, copy, trace, recolor, or derive any asset from this repository.** Not for placeholders, not for "temporary" art, not for reference-while-drawing.
- The cloned repo stays under `research/reference-repos/` which is **gitignored** — these files must never enter our git history. This is enforced in `.gitignore` and called out in `IP-COMPLIANCE.md`.

## What we reuse

- **High-level mechanics cross-reference only**: confirmation of the building set, presence of a research/tech system, and a dungeon+boss PvE loop. These are *ideas/mechanics* (not copyrightable), corroborated against the wikis — never code or assets.

## What we do NOT take

- **No code** (no license → all rights reserved).
- **No assets whatsoever** (EA-owned).
- **No UI layout pixels** — our UI is an original dark, data-dense admin aesthetic (`DESIGN-SYSTEM.md`), not a reproduction of LoU's skin.
