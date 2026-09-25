# CLAUDE.md: Gourd Guard

## What this project is
A Halloween lane-defense puzzle game for mobile (working title "Gourd Guard"). The player slides pumpkins on a 7×5 patch to form same-color bunches, then flicks them so each pumpkin flies straight up its column at monsters that are chewing per-column walls. Goal: a polished **120-level** mobile game: 6 worlds × 20 levels.

The owner designs the rules; your job is to implement them faithfully, keep the design doc in sync, and validate balance with the automated bot.

## Read first, every session
1. `docs/GAME_DESIGN.md`: the source of truth for every rule, number and past decision **as currently built** (see "Decisions log" before proposing changes that were already tried and reverted).
2. `docs/WORLDS.md`: the locked Release 1 target: 6 worlds, gimmicks, pumpkins, monsters, bosses, weapons, and the R2 backlog. Where it disagrees with the design doc, it is the target and the design doc catches up when the code does.
3. `src/`: the game. `engine/` (board, combat, monsters, walls, spawner, input, audio, render/), `data/` (pumpkins, monsters, patterns, shop, `worlds/world1..6.js` level tables), `ui/` (screens, hud), `save.js`, `main.js` (boot only). Plain JavaScript ES modules built with Vite; no runtime dependencies.

## Current state
- Game is feature-complete for 15 nights: sliding + push controls, bunches with rainbow wildcard, 6 pumpkin types with 5 levels each, gradual unlocks, loadout of 5 from night 8, graves, per-column walls, sprouts/drops, shop, endless mode, synthesized sound.
- Restructured (2026-09-25) from one HTML file into `src/` modules with behaviour verified identical by the bot. Levels are data: `src/data/worlds/world1.js` holds the 15 prototype nights; `world2..6.js` are empty and waiting for Release 1 content (`docs/WORLDS.md`).
- All art is drawn in code on a canvas; all sound is Web Audio. No external assets.
- Save data lives in localStorage key `gourdguard.v1` (keep migrations backward-compatible; the game already refunds removed upgrades).
- Shared mutable state (`G`, `grid`, `graves`, `walls`, `state`, `gest`) lives in `src/engine/state.js`; other modules read it through imports and write it only through its `setX()` functions.

## Next milestone: Release 1 content
Build `docs/WORLDS.md` one rule or world at a time, each with its own bot runs. Order: new ground rules (§2) → world 1 as 20 data levels → worlds 2–6 with their gimmicks, pumpkins, monsters and bosses.
- Levels must be data: every level's monsters, pacing, pattern, graves and unlocks come from `src/data/worlds/*.js` (schema in `src/data/levels.js`, target shape in `docs/WORLDS.md` §9).
- Keep the engine free of level-specific numbers.

## How to run
- `npm install` once, then `npm run dev` for a live-reload dev server, or `npm run build` to produce `dist/`.
- To play a build: `python3 tools/serve_dist.py` serves `dist/` on http://127.0.0.1:4173/ (no cache headers, safe for tests).
- Test hook: opening the page with `?test` exposes `window.__gg` (game state and actions) for automated tests. Never expose it without the flag.

## How to test
- Python tools live in a venv: `.venv/bin/python` (create with `python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/playwright install chromium`).
- Always test the **build**: `npm run build`, start `tools/serve_dist.py`, then pass `--url http://127.0.0.1:4173/` to the tools below.
- `.venv/bin/python tools/smoke_test.py --url …`: plays with real mouse input on phone and desktop sizes; fails on any page error.
- `.venv/bin/python tools/balance_bot.py --nights 1,5,10,15 --repeats 3 --url …`: human-paced bot plays full nights and prints one JSON line per run plus a per-night summary (win rate, mean wall %). Single runs are noise; **3 repeats per night is the minimum** for any balance claim. Run it after any rule or number change and record results in the design doc's balance section.
- `node tools/check_levels.mjs`: proves `world1.js` still reproduces the prototype's level formulas. Delete it once world 1 is redesigned for Release 1.

## Working rules
- **Rules change → design doc changes in the same edit.** Never let code and `GAME_DESIGN.md` disagree.
- Ask the owner before changing a rule they set. When a rule is ambiguous, propose a default, state it, and note it in the doc.
- Balance changes must be justified with bot runs (before/after), not guesses.
- Mobile first: touch targets ≥44 px, works one-handed, respects safe areas, no hover-only UI.
- Performance: keep 60 fps on mid-range phones; pre-render sprites; avoid per-frame allocations in hot loops.
- Original IP only: don't use the names, art or text of "Pumpkins vs. Monsters" or Plants vs. Zombies; don't describe the game as a remake. Art stays original (drawn in code unless the owner provides assets).
- Keep the game fully playable offline with no network requests other than Google Fonts (and plan to self-host fonts for the mobile build).

## Longer-term plan (see design doc §15)
New ground rules → more pumpkin types and a 120-level power-scaling model → monster variety and bosses → map variety → 120 levels in 6 worlds → art/music polish → installable web app → Capacitor builds for App Store and Google Play.
